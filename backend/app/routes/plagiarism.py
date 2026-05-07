import traceback
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi.responses import FileResponse
import os
import fitz
from fastapi import BackgroundTasks
import nltk

from app.database.session import get_db
from app.models.document import Document, DocType, DocStatus
from app.models.sentence import Sentence
from app.utils.pdf_handler import extract_text_and_coords
from app.service.plagiarismcheck_service import plagiarism_checker
from app.utils.nlp_pipeline import clean_and_normalize_plagiarism
from app.models.user import User
from app.models.checkjob import CheckJob, JobStatus
from app.models.sentencecomparison import SentenceComparison
from app.models.report import PlagiarismReport, ReportDetail, Verdict
from app.utils.limiter import limiter
from app.service.auth_service import get_current_user, require_current_user


router = APIRouter(prefix="/api/plagiarism", tags=["Plagiarism Checker"])

def run_similarity_engine(db, job, submission_sentences, threshold, tolerance=0):
    """
    Logika inti pencocokan TF-IDF yang digunakan bersama oleh PDF, DOCX, dan Manual Text.
    """
    # Ambil SEMUA kalimat referensi yang sudah di-index
    all_refs = db.query(Sentence).join(Document).filter(
        Document.doc_type == DocType.reference,
        Document.status == DocStatus.indexed
    ).order_by(Sentence.id).all()
    
    ref_ids = [ref.id for ref in all_refs]
    
    # --- TAMBAHAN OPTIMASI 1: Buat Lookup Table ---
    # Ini membuat pencarian referensi menjadi INSTAN (O(1))
    ref_dict = {ref.id: ref for ref in all_refs} 

    sub_texts = [sub_sent.normalized_text for sub_sent in submission_sentences]

    comparisons_to_save = []
    flagged_sentence_ids = set()
    matched_docs_tracker = {}

    batch_matches = plagiarism_checker.check_batch_similarity(
        query_sentences=sub_texts, 
        db_sentence_ids=ref_ids, 
        threshold=threshold
    )

    # Baru kita looping untuk menyimpan ke database
    for i, sub_sent in enumerate(submission_sentences):
        matches = batch_matches[i]
        
        if matches:
            best_match = matches[0] 
            comp = SentenceComparison(
                job_id=job.id,
                source_sentence_id=sub_sent.id, 
                target_sentence_id=best_match["target_sentence_id"], 
                cosine_similarity=best_match["similarity_pct"] / 100.0,
                is_flagged=True
            )
            comparisons_to_save.append(comp)
            flagged_sentence_ids.add(sub_sent.id)
            
            # Gunakan ref_dict dari Optimasi 1
            target_sent_record = ref_dict.get(best_match["target_sentence_id"])
            if target_sent_record:
                doc_id = target_sent_record.document_id
                matched_docs_tracker[doc_id] = matched_docs_tracker.get(doc_id, 0) + 1

    # ═══ TOLERANCE FILTER (Small Match Exclusion) ═══
    # Buang sumber referensi yang kontribusi totalnya di bawah batas toleransi user.
    # Contoh: tolerance=1 artinya sumber yang hanya menyumbang <1% dari total kalimat akan diabaikan.
    if tolerance > 0:
        total_sub = len(submission_sentences)
        docs_to_exclude = set()
        for doc_id, count in matched_docs_tracker.items():
            source_pct = round((count / total_sub * 100),2) if total_sub > 0 else 0
            if source_pct < tolerance:
                docs_to_exclude.add(doc_id)
        
        if docs_to_exclude:
            # Cari ID kalimat referensi milik sumber yang di-exclude
            excluded_target_ids = {r.id for r in all_refs if r.document_id in docs_to_exclude}
            
            # Filter ulang comparisons dan flagged sentences
            filtered_comps = []
            filtered_flagged = set()
            for comp in comparisons_to_save:
                if comp.target_sentence_id not in excluded_target_ids:
                    filtered_comps.append(comp)
                    filtered_flagged.add(comp.source_sentence_id)
            
            comparisons_to_save = filtered_comps
            flagged_sentence_ids = filtered_flagged
            for doc_id in docs_to_exclude:
                del matched_docs_tracker[doc_id]

    if comparisons_to_save:
        db.add_all(comparisons_to_save)

    # Kalkulasi Laporan
    total_sub_sentences = len(submission_sentences)
    flagged_count = len(flagged_sentence_ids)
    overall_pct = (flagged_count / total_sub_sentences * 100) if total_sub_sentences > 0 else 0

    if overall_pct <= 10: final_verdict = Verdict.clean
    elif overall_pct <= 30: final_verdict = Verdict.low
    elif overall_pct <= 60: final_verdict = Verdict.medium
    else: final_verdict = Verdict.high

    report = PlagiarismReport(
        job_id=job.id,
        overall_similarity_pct=overall_pct,
        flagged_sentence_count=flagged_count,
        total_sentence_count=total_sub_sentences,
        unique_source_count=len(matched_docs_tracker),
        verdict=final_verdict
    )
    db.add(report)
    db.flush()

    for ref_doc_id, match_count in matched_docs_tracker.items():
        detail = ReportDetail(
            report_id=report.id,
            target_doc_id=ref_doc_id,
            matched_sentences=match_count,
            similarity_pct=(match_count / total_sub_sentences * 100) if total_sub_sentences > 0 else 0 
        )
        db.add(detail)

def process_upload_reference_task(doc_id: int, file_location: str):
    """Fungsi ini berjalan di background untuk memproses dokumen referensi dan melatih AI."""
    from app.database.session import SessionLocal 
    db = SessionLocal()

    try:
        # 1. Ambil dokumen dari database
        doc = db.query(Document).filter(Document.id == doc_id).first()
        print(f"⚙️ Memulai proses background Upload Reference untuk Doc ID: {doc_id}")

        # 2. Ekstraksi teks dan koordinat (Kita biarkan exclude_bibliography=False untuk referensi)
        extracted_blocks = extract_text_and_coords(file_location, exclude_bibliography=False)
        
        if not extracted_blocks:
            raise ValueError("Tidak ada teks yang bisa diekstrak dari PDF ini")

        # 3. Preprocessing & Simpan Sentences
        sentence_objects = []
        for index, block in enumerate(extracted_blocks):
            raw_text = block["text"]
            normalized = clean_and_normalize_plagiarism(raw_text)
            
            if not normalized.strip():
                continue

            sent = Sentence(
                document_id=doc.id,
                sentence_index=index,
                page_number=block["page"],
                bounding_boxes=[block["bbox"]],
                raw_text=raw_text,
                normalized_text=normalized,
                char_count=len(raw_text)
            )
            sentence_objects.append(sent)

        db.add_all(sentence_objects)
        
        # Update metrik dokumen
        doc.sentence_count = len(sentence_objects)
        doc.status = DocStatus.indexed
        db.flush() # Flush sebelum training TF-IDF

        # ==========================================
        # 4. TRIGGER MACHINE LEARNING (TF-IDF)
        # ==========================================
        print("🧠 Mengekstrak seluruh corpus referensi untuk training AI...")
        all_reference_sentences = db.query(Sentence).join(Document).filter(
            Document.doc_type == DocType.reference,
            Document.status == DocStatus.indexed
        ).order_by(Sentence.id).all()
        
        texts_to_train = [s.normalized_text for s in all_reference_sentences if s.normalized_text]
        
        if texts_to_train:
            plagiarism_checker.train_and_save_model(texts_to_train)
        
        db.commit()
        print(f"✅ Background task Upload Reference SELESAI. Total corpus di memori: {len(texts_to_train)} kalimat.")

    except Exception as e:
        db.rollback()
        # Jika gagal, tandai dokumen sebagai Failed
        if 'doc' in locals() and doc:
            doc.status = DocStatus.failed
            db.commit()
        
        import traceback
        print(f"❌ Background task Upload Reference GAGAL untuk Doc ID: {doc_id}. Error:\n{traceback.format_exc()}")
    finally:
        db.close()

def process_plagiarism_task(job_id: int, file_location: str, threshold: float, exclude_bib: bool, tolerance: float = 0):
    from app.database.session import SessionLocal 
    db = SessionLocal()
    try:
        job = db.query(CheckJob).filter(CheckJob.id == job_id).first()
        sub_doc = job.source_doc

        # 1. Ekstrak Teks
        extracted_blocks = extract_text_and_coords(file_location, exclude_bibliography=exclude_bib)

        # 2. Simpan Kalimat
        submission_sentences = []
        for index, block in enumerate(extracted_blocks):
            normalized = clean_and_normalize_plagiarism(block["text"])
            if not normalized.strip(): continue
            
            sent = Sentence(document_id=sub_doc.id, sentence_index=index,
                            page_number=block["page"], bounding_boxes=[block["bbox"]],
                            raw_text=block["text"], normalized_text=normalized, char_count=len(block["text"]))
            submission_sentences.append(sent)

        db.add_all(submission_sentences)
        db.flush()
        sub_doc.sentence_count = len(submission_sentences)

        # 3. Jalankan Engine
        run_similarity_engine(db, job, submission_sentences, threshold, tolerance)

        sub_doc.status = DocStatus.indexed
        job.status = JobStatus.done
        db.commit()
    except Exception as e:
        db.rollback()
        job.status = JobStatus.failed
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()

@router.post("/upload-reference")
async def upload_reference_document(
    background_tasks: BackgroundTasks, # <--- Wajib ditambahkan
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: int = Form(1, description="ID Admin"),
    db: Session = Depends(get_db)
):
    """
    Endpoint untuk mengunggah PDF referensi (Respons Instan via Background Tasks).
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Hanya menerima file PDF")

    try:
        # 1. Simpan catatan awal dokumen (Status: Processing)
        new_doc = Document(
            user_id=user_id,
            title=title,
            original_filename=file.filename,
            doc_type=DocType.reference,
            status=DocStatus.processing
        )
        db.add(new_doc)
        db.flush() 

        # 2. Simpan PDF secara fisik
        file_location = f"app/uploads/{new_doc.id}_{file.filename}"
        upload_dir = "app/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        with open(file_location, "wb") as f:
            f.write(await file.read())
            
        new_doc.file_path = file_location
        db.commit() # Wajib dicommit agar worker background bisa menemukan ID-nya

        # ==========================================
        # 3. LEMPAR KE BACKGROUND
        # ==========================================
        background_tasks.add_task(process_upload_reference_task, new_doc.id, file_location)

        return {
            "message": "Dokumen referensi berhasil diunggah. Sedang diproses dan melatih model AI di latar belakang.",
            "document_id": new_doc.id,
            "status": "processing"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat inisiasi upload: {str(e)}")

@router.get("/references")
def list_reference_documents(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: Session = Depends(get_db)
):
    """
    Endpoint untuk mengambil daftar semua dokumen referensi (untuk Admin Dashboard).
    Mendukung pagination dan pencarian berdasarkan judul.
    """
    query = db.query(Document).filter(Document.doc_type == DocType.reference)
    
    if search.strip():
        query = query.filter(Document.title.ilike(f"%{search}%"))
    
    total = query.count()
    documents = query.order_by(Document.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "original_filename": doc.original_filename,
                "sentence_count": doc.sentence_count or 0,
                "status": doc.status.value if hasattr(doc.status, 'value') else doc.status,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            }
            for doc in documents
        ]
    }

@router.delete("/references/{doc_id}")
def delete_reference_document(doc_id: int, db: Session = Depends(get_db)):
    """
    Endpoint untuk menghapus dokumen referensi beserta kalimatnya.
    Setelah menghapus, model TF-IDF akan dilatih ulang.
    """
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.doc_type == DocType.reference
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen referensi tidak ditemukan")
    
    try:
        # Hapus file fisik jika ada
        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        
        # Hapus dokumen (sentences terhapus otomatis via cascade)
        db.delete(doc)
        db.commit()
        
        # Latih ulang model TF-IDF tanpa dokumen yang dihapus
        all_reference_sentences = db.query(Sentence).join(Document).filter(
            Document.doc_type == DocType.reference,
            Document.status == DocStatus.indexed
        ).order_by(Sentence.id).all()
        
        texts_to_train = [s.normalized_text for s in all_reference_sentences if s.normalized_text]
        
        if texts_to_train:
            plagiarism_checker.train_and_save_model(texts_to_train)
        else:
            # Jika tidak ada referensi lagi, hapus model
            import joblib
            from scipy import sparse
            if os.path.exists(plagiarism_checker.vectorizer_path):
                os.remove(plagiarism_checker.vectorizer_path)
            if os.path.exists(plagiarism_checker.matrix_path):
                os.remove(plagiarism_checker.matrix_path)
            plagiarism_checker.vectorizer = None
            plagiarism_checker.corpus_matrix = None
        
        return {"message": f"Dokumen referensi '{doc.title}' berhasil dihapus dan model AI diperbarui."}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menghapus: {str(e)}")

@router.get("/setup-admin")
def setup_admin_darurat(db: Session = Depends(get_db)):
    """
    Endpoint sementara untuk memancing database agar punya 1 User Admin.
    Cukup klik 1 kali saja di Swagger UI.
    """
    try:
        # Cek apakah user 1 sudah ada
        from app.models.user import User # Sesuaikan path file user.py kamu
        
        existing_user = db.query(User).filter(User.id == 1).first()
        if existing_user:
            return {"message": "Admin ID 1 sudah ada, silakan lanjut upload PDF!"}

        # Jika belum ada, buat baru
        # CATATAN: Sesuaikan isi (email, password, dll) dengan kolom wajib di model User kamu!
        new_admin = User(
            id=1,
            username   = 'admin',
            email      = 'admin@wordlens.com',
            password   ="1234",
            role       = "admin"
        )
        db.add(new_admin)
        db.commit()
        return {"message": " Sukses! Admin ID 1 berhasil dibuat. Sekarang Upload PDF pasti berhasil!"}
        
    except Exception as e:
        db.rollback()
        return {"error": f"Gagal membuat admin: {str(e)}"}

@router.post("/check-document")
@limiter.limit("1/minute")
async def check_plagiarism(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    # user_id: int = Form(1),
    threshold: float = Form(0.5),
    exclude_bibliography: bool = Form(True),
    tolerance: float = Form(0, description="Toleransi minimum kontribusi sumber (dalam %). Sumber di bawah angka ini akan diabaikan."),
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    ext = file.filename.lower().split('.')[-1]
    if ext not in ['pdf', 'docx']:
        raise HTTPException(status_code=400, detail="Format file harus PDF atau DOCX")

    # 1. Simpan Meta
    user_id = user.id
    sub_doc = Document(title=title, original_filename=file.filename,
                       doc_type=DocType.submission, status=DocStatus.processing, user_id=user_id)
    db.add(sub_doc)
    db.flush()

    # 2. Simpan File Fisik
    upload_dir = "app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_location = f"{upload_dir}/sub_{sub_doc.id}_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # --- LOGIKA KONVERSI DOCX KE PDF ---
    final_pdf_path = file_location
    if ext == 'docx':
        from app.utils.pdf_handler import convert_docx_to_pdf
        pdf_path = convert_docx_to_pdf(file_location, upload_dir)
        if pdf_path:
            final_pdf_path = pdf_path
            # Hapus file docx asli agar tidak menumpuk (opsional)
            # os.remove(file_location) 
        else:
            raise HTTPException(status_code=500, detail="Gagal mengonversi Word ke PDF")

    sub_doc.file_path = final_pdf_path
    
    job = CheckJob(source_doc_id=sub_doc.id, user_id=user_id,
                   similarity_threshold=threshold, status=JobStatus.queued)
    db.add(job)
    db.commit()

    background_tasks.add_task(process_plagiarism_task, job.id, final_pdf_path, threshold, exclude_bibliography, tolerance)

    return {"message": "Dokumen sedang diproses", "job_id": job.id}

@router.get("/download-report/{job_id}")
async def download_highlighted_report(job_id: int, db: Session = Depends(get_db)):
    job = db.query(CheckJob).filter(CheckJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan")

    if job.status != JobStatus.done or not job.report:
        raise HTTPException(
            status_code=400, 
            detail="Laporan belum siap. Silakan tunggu hingga proses pengecekan selesai."
        )

    if not job.source_doc.file_path:
        raise HTTPException(
            status_code=400, 
            detail="Fitur download PDF tidak tersedia untuk pengecekan teks manual. Silakan lihat hasil di Dashboard."
        )

    report = job.report
    flagged_comparisons = db.query(SentenceComparison).filter(
        SentenceComparison.job_id == job_id,
        SentenceComparison.is_flagged == True
    ).all()

    try:
        original_pdf_path = job.source_doc.file_path
        doc = fitz.open(original_pdf_path)

        # Warna-warna tegas ala Turnitin (Biru, Teal, Ungu, Hijau, Oranye, Biru Terang)
        # Digunakan untuk Highlight Teks & Lingkaran Nomor
        THEME_COLORS = [
            (0.08, 0.46, 0.81),  # Biru Tua (#1576CF)
            (0.00, 0.53, 0.53),  # Teal (#008787)
            (0.53, 0.35, 0.80),  # Ungu (#8859CC)
            (0.18, 0.54, 0.20),  # Hijau (#2E8A33)
            (0.85, 0.40, 0.11),  # Oranye (#D9661C)
            (0.00, 0.45, 0.65),  # Biru Terang (#0073A6)
            (0.80, 0.15, 0.20)   # Merah (#CC2633)
        ]
        
        # 0. PRE-MAPPING WARNA
        # Kita petakan warna sejak awal berdasarkan urutan sumber agar halaman ringkasan 
        # dan warna highlight di dalam PDF 100% konsisten.
        doc_color_map = {}
        for idx, detail in enumerate(report.details):
            doc_color_map[detail.target_doc.id] = THEME_COLORS[idx % len(THEME_COLORS)]

        # --- 1. PROSES HIGHLIGHTING ---
        for comp in flagged_comparisons:
            sentence = comp.source_sentence
            source_title = comp.target_sentence.document.title
            source_doc_id = comp.target_sentence.document_id
            
            # Ambil warna dari map, default hitam jika tidak ditemukan (seharusnya tidak terjadi)
            current_color = doc_color_map.get(source_doc_id, (0, 0, 0))
            
            if sentence.page_number < len(doc):
                page = doc.load_page(sentence.page_number)
                text_instances = page.search_for(sentence.raw_text)
                
                for inst in text_instances:
                    annot = page.add_highlight_annot(inst)
                    annot.set_colors(stroke=current_color) 
                    current_date = fitz.get_pdf_now()
                    annot.set_info(
                        title="WordLens Checker", # Ubah nama Author sesuai aplikasimu
                        content=f"Sumber: {source_title}\nKemiripan: {round(comp.cosine_similarity * 100, 2)}%",
                        creationDate=current_date,  # Tanggal dibuat
                        modDate=current_date        # Tanggal dimodifikasi
                    )
                    annot.set_info(content=f"Sumber: {source_title}")
                    annot.update()

        # --- 2. MEMBUAT HALAMAN RINGKASAN ALA TURNITIN ---
        summary_page = doc.new_page()
        page_width = summary_page.rect.width
        page_height = summary_page.rect.height
        
        # Fungsi Bantuan untuk Rata Tengah (Center Text) - DEFAULT FONT DIPERBAIKI
        def draw_centered_text(text, y_pos, fontsize, color, fontname="helvetica"):
            # Sekarang menggunakan nama font standar yang dikenali get_text_length
            text_length = fitz.get_text_length(text, fontname=fontname, fontsize=fontsize)
            x_pos = (page_width - text_length) / 2
            summary_page.insert_text(fitz.Point(x_pos, y_pos), text, fontsize=fontsize, color=color, fontname=fontname)

        # A. Header Utama (Angka Persentase Besar)
        main_blue = (0.08, 0.46, 0.81)
        grey_text = (0.4, 0.4, 0.4)
        
        overall_val = report.overall_similarity_pct
        pct_str = "< 1%" if 0 < overall_val < 1 else f"{round(overall_val)}%"
        
        # MENGGUNAKAN "helvetica-bold"
        draw_centered_text(pct_str, 80, fontsize=50, color=main_blue, fontname="helvetica-bold")
        draw_centered_text("OVERALL SIMILARITY", 105, fontsize=10, color=grey_text, fontname="helvetica-bold")
        
        # Garis Pembatas Tipis
        summary_page.draw_line(fitz.Point(50, 125), fitz.Point(page_width-50, 125), color=(0.9, 0.9, 0.9), width=1)

        # B. Daftar Sumber (Card Layout)
        y_pos = 145
        card_margin_x = 50
        card_width = page_width - (card_margin_x * 2)
        card_height = 45

        for idx, detail in enumerate(report.details):
            if y_pos + card_height > page_height - 50:
                summary_page = doc.new_page()
                y_pos = 50

            target_id = detail.target_doc.id
            color = doc_color_map.get(target_id, (0,0,0))
            
            # --- Gambar Kotak (Card Border) ---
            rect = fitz.Rect(card_margin_x, y_pos, card_margin_x + card_width, y_pos + card_height)
            summary_page.draw_rect(rect, color=(0.85, 0.85, 0.85), fill=(1, 1, 1), width=1)
            
            # --- Gambar Lingkaran Nomor ---
            circle_center = fitz.Point(card_margin_x + 30, y_pos + (card_height / 2))
            summary_page.draw_circle(circle_center, 14, color=color, fill=color)
            
            # Angka dalam lingkaran (menggunakan helvetica-bold)
            num_str = str(idx + 1)
            num_len = fitz.get_text_length(num_str, fontsize=12, fontname="helvetica-bold")
            summary_page.insert_text(fitz.Point(circle_center.x - (num_len/2), circle_center.y + 4), num_str, color=(1,1,1), fontsize=12, fontname="helvetica-bold")

            # --- Teks Judul Sumber (menggunakan helvetica) ---
            title = detail.target_doc.title
            if len(title) > 40:
                title = title[:37] + "..."
            summary_page.insert_text(fitz.Point(card_margin_x + 60, y_pos + 18), title, fontsize=11, color=(0.2, 0.2, 0.2), fontname="helvetica")
            
            # --- Teks Jenis Sumber (menggunakan helvetica) ---
            summary_page.insert_text(fitz.Point(card_margin_x + 60, y_pos + 32), "DATABASE INTERNAL", fontsize=8, color=(0.6, 0.6, 0.6), fontname="helvetica")

            # --- Teks Persentase (Rata Kanan, menggunakan helvetica-bold) ---
            sim_val = detail.similarity_pct
            sim_str = "< 1%" if 0 < sim_val < 1 else f"{round(sim_val)}%"
            sim_len = fitz.get_text_length(sim_str, fontsize=20, fontname="helvetica-bold")
            
            sim_x = (card_margin_x + card_width) - sim_len - 20
            summary_page.insert_text(fitz.Point(sim_x, y_pos + 30), sim_str, fontsize=20, color=color, fontname="helvetica-bold")

            # --- Menambahkan Hyperlink ke Kotak ---
            link_uri = f"http://127.0.0.1:8000/api/plagiarism/view-reference/{target_id}"
            summary_page.insert_link({"kind": fitz.LINK_URI, "from": rect, "uri": link_uri})

            y_pos += card_height + 10

        # 4. Simpan dan Kirim
        # 4. Simpan dan Kirim
        report_filename = f"REPORT_FINAL_{job_id}.pdf"
        
        # --- TENTUKAN FOLDER BARU DI SINI ---
        report_dir = "app/reports" 
        
        # Pastikan foldernya otomatis terbuat jika belum ada
        os.makedirs(report_dir, exist_ok=True) 
        
        # Gabungkan nama folder dan nama file
        report_path = os.path.join(report_dir, report_filename)
        doc.save(report_path)
        doc.close()

        original_name = job.source_doc.original_filename
        base_name = os.path.splitext(original_name)[0]
        download_name = f"Hasil_Lengkap_{base_name}.pdf"

        return FileResponse(path=report_path, filename=download_name, media_type="application/pdf")

    except Exception as e:
        import traceback
        print(f"Error Generate PDF: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Gagal generate halaman akhir PDF")

@router.post("/check-text")
@limiter.limit("5/minute")
async def check_plagiarism_text_instan(
    request: Request,
    content: str = Form(..., description="Teks hasil copy-paste (Maks 250 kata)"),
    threshold: float = Form(0.5),
    tolerance: float = Form(0, description="Toleransi minimum kontribusi sumber (dalam %). Sumber di bawah angka ini akan diabaikan."),
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint Instan: Mengecek teks manual tanpa menyimpannya ke database.
    Maksimal 250 kata. Mengembalikan hasil komparasi langsung secara realtime.
    """
    # 1. Validasi Teks Kosong
    if not content.strip():
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong")

    # 2. Validasi Batas Kata (Maksimal 250 kata)
    words = content.split()
    if len(words) > 250:
        raise HTTPException(
            status_code=400, 
            detail=f"Teks terlalu panjang. Maksimal 250 kata, teks Anda memiliki {len(words)} kata."
        )

    try:
        # 3. Tokenisasi dan Normalisasi
        raw_sentences = nltk.sent_tokenize(content)
        submission_sentences = []
        
        for raw_text in raw_sentences:
            normalized = clean_and_normalize_plagiarism(raw_text)
            if normalized.strip():
                submission_sentences.append({
                    "raw_text": raw_text,
                    "normalized_text": normalized
                })

        if not submission_sentences:
            raise HTTPException(status_code=400, detail="Teks tidak mengandung kalimat yang valid untuk dicek.")

        # 4. Ambil Kalimat Referensi
        all_refs = db.query(Sentence).join(Document).filter(
            Document.doc_type == DocType.reference,
            Document.status == DocStatus.indexed
        ).all()
        ref_ids = [ref.id for ref in all_refs]

        # 5. Proses Pencocokan AI
        flagged_count = 0
        matched_docs_tracker = {}
        sentences_result = []
        
        # --- TAMBAHAN UNTUK WARNA (COLOR INDEXING) ---
        source_color_index_map = {}
        color_counter = 0

        for sub_sent in submission_sentences:
            matches = plagiarism_checker.check_sentence_similarity(
                query_sentence=sub_sent["normalized_text"], 
                db_sentence_ids=ref_ids, 
                threshold=threshold
            )
            
            if matches:
                flagged_count += 1
                best_match = matches[0] 
                
                target_sent_record = next((r for r in all_refs if r.id == best_match["target_sentence_id"]), None)
                
                source_title = target_sent_record.document.title if target_sent_record else "Sumber Tidak Diketahui"
                source_text = target_sent_record.raw_text if target_sent_record else ""
                
                doc_id = target_sent_record.document_id if target_sent_record else 0
                
                # Lacak dan petakan warnanya
                if doc_id not in matched_docs_tracker:
                    matched_docs_tracker[doc_id] = {"title": source_title, "count": 0}
                    # Berikan index warna (0, 1, 2, dst) untuk sumber baru ini
                    source_color_index_map[doc_id] = color_counter
                    color_counter += 1
                    
                matched_docs_tracker[doc_id]["count"] += 1

                sentences_result.append({
                    "text": sub_sent["raw_text"],
                    "is_flagged": True,
                    "matched_source_title": source_title,
                    "matched_sentence_text": source_text,
                    "similarity_pct": round(best_match["similarity_pct"], 2),
                    "color_index": source_color_index_map[doc_id],
                    "_source_doc_id": doc_id  # Internal: untuk tolerance filter
                })
            else:
                sentences_result.append({
                    "text": sub_sent["raw_text"],
                    "is_flagged": False
                })

        # ═══ TOLERANCE FILTER (Small Match Exclusion) ═══
        if tolerance > 0 and len(submission_sentences) > 0:
            total_temp = len(submission_sentences)
            docs_to_exclude = set()
            for doc_id, data in matched_docs_tracker.items():
                source_pct = (data["count"] / total_temp * 100)
                if source_pct < tolerance:
                    docs_to_exclude.add(doc_id)
            
            if docs_to_exclude:
                # Unflag kalimat dari sumber yang di-exclude
                flagged_count = 0
                for sent in sentences_result:
                    if sent.get("is_flagged") and sent.get("_source_doc_id") in docs_to_exclude:
                        sent["is_flagged"] = False
                        for key in ["matched_source_title", "matched_sentence_text", "similarity_pct", "color_index", "_source_doc_id"]:
                            sent.pop(key, None)
                    elif sent.get("is_flagged"):
                        flagged_count += 1
                
                # Hapus sumber yang di-exclude dari tracker
                for doc_id in docs_to_exclude:
                    del matched_docs_tracker[doc_id]
                
                # Rebuild color index setelah filtering
                source_color_index_map = {}
                color_counter = 0
                for doc_id in matched_docs_tracker:
                    source_color_index_map[doc_id] = color_counter
                    color_counter += 1
                
                # Update color_index di kalimat yang masih flagged
                for sent in sentences_result:
                    if sent.get("is_flagged") and "_source_doc_id" in sent:
                        sent["color_index"] = source_color_index_map.get(sent["_source_doc_id"], 0)

        # Bersihkan field internal _source_doc_id
        for sent in sentences_result:
            sent.pop("_source_doc_id", None)

        # 6. Kalkulasi Laporan Akhir
        total_sub_sentences = len(submission_sentences)
        overall_pct = (flagged_count / total_sub_sentences * 100) if total_sub_sentences > 0 else 0

        if overall_pct <= 10: final_verdict = "CLEAN"
        elif overall_pct <= 30: final_verdict = "LOW"
        elif overall_pct <= 60: final_verdict = "MEDIUM"
        else: final_verdict = "HIGH"

        # Format daftar sumber (Jangan lupa selipkan warnanya juga di legend/daftar sumber)
        sources = [
            {
                "source_title": data["title"], 
                "matched_sentences_count": data["count"],
                "color_index": source_color_index_map.get(doc_id, 0), # <--- DIKIRIM KE REACT
                "document_link": f"/api/plagiarism/view-reference/{doc_id}"
            }
            for doc_id, data in matched_docs_tracker.items()
        ]

        # 7. Langsung kembalikan JSON
        return {
            "message": "Pengecekan instan selesai.",
            "mode": "quick_check_memory",
            "summary": {
                "overall_similarity_pct": round(overall_pct, 2),
                "verdict": final_verdict,
                "flagged_sentence_count": flagged_count,
                "total_sentence_count": total_sub_sentences
            },
            "sources": sources,
            "sentences": sentences_result
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error Check Text: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/{job_id}/json")
async def get_json_report(job_id: int, db: Session = Depends(get_db)):
    """
    Endpoint untuk mengambil hasil laporan dalam format JSON.
    Sangat cocok untuk menampilkan hasil Input Teks Manual di UI Frontend React.
    """
    job = db.query(CheckJob).filter(CheckJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan")

    # Jika masih diproses, beritahu frontend agar terus melakukan polling/menunggu
    if job.status != JobStatus.done:
        return {
            "job_id": job.id, 
            "status": job.status.value,
            "message": "Pengecekan masih berlangsung..."
        }

    report = job.report
    if not report:
        raise HTTPException(status_code=404, detail="Laporan belum tersedia")

    # 1. Ambil daftar Jurnal/Referensi yang plagiat
    sources = []
    source_color_index_map = {}
    for idx,detail in enumerate(report.details):
        target_id = detail.target_doc.id
        source_color_index_map[target_id] = idx
        sources.append({
            "source_title": detail.target_doc.title,
            "similarity_pct": round(detail.similarity_pct, 2),
            "matched_sentences_count": detail.matched_sentences,
            "color_index": idx,
            "document_link": f"/api/plagiarism/view-reference/{target_id}"
        })

    # 2. Ambil SEMUA kalimat dari teks/dokumen yang dicek (berdasarkan urutan)
    submission_sentences = db.query(Sentence).filter(
        Sentence.document_id == job.source_doc_id
    ).order_by(Sentence.sentence_index).all()

    # 3. Ambil data komparasi untuk mencari tahu kalimat mana saja yang plagiat
    comparisons = db.query(SentenceComparison).filter(
        SentenceComparison.job_id == job_id, 
        SentenceComparison.is_flagged == True
    ).all()

    # Buat dictionary (lookup table) agar pencarian kalimat plagiat lebih cepat
    comp_dict = {comp.source_sentence_id: comp for comp in comparisons}

    # 4. Rakit kalimat beserta status plagiatnya untuk ditampilkan di UI
    sentences_result = []
    for sent in submission_sentences:
        data = {
            "text": sent.raw_text,
            "is_flagged": False
        }
        
        # Jika kalimat ini ada di daftar plagiat, tambahkan detail sumbernya
        if sent.id in comp_dict:
            comp = comp_dict[sent.id]
            source_doc_id = comp.target_sentence.document_id
            data["is_flagged"] = True
            data["matched_source_title"] = comp.target_sentence.document.title
            data["matched_sentence_text"] = comp.target_sentence.raw_text
            data["similarity_pct"] = round(comp.cosine_similarity * 100, 2)
            data["color_index"] = source_color_index_map.get(source_doc_id, 0)
            
        sentences_result.append(data)

    # 5. Kembalikan data utuh ke Frontend
    return {
        "job_id": job.id,
        "status": job.status.value,
        "document_title": job.source_doc.title,
        "summary": {
            "overall_similarity_pct": round(report.overall_similarity_pct, 2),
            "verdict": report.verdict.value if hasattr(report.verdict, 'value') else report.verdict,
            "flagged_sentence_count": report.flagged_sentence_count,
            "total_sentence_count": report.total_sentence_count
        },
        "sources": sources,
        "sentences": sentences_result
    }

@router.get("/view-reference/{doc_id}")
async def view_reference_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.file_path:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File fisik dokumen tidak ditemukan")
    
    # Akan membuka PDF langsung di tab browser (inline), bukan mendownloadnya
    return FileResponse(
        path=doc.file_path, 
        filename=doc.original_filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={doc.original_filename}"}
    )

@router.get("/history/user")
async def get_user_check_history(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint untuk mengambil riwayat pengecekan (CheckJobs) milik user yang sedang login.
    """

    jobs = db.query(CheckJob).filter(
        CheckJob.user_id == user.id
    ).order_by(CheckJob.created_at.desc()).all()

    history_data = []
    for job in jobs:
        report_data = None
        if job.report:
            report_data = {
                "overall_similarity_pct": job.report.overall_similarity_pct,
                "verdict": job.report.verdict.value if hasattr(job.report.verdict, 'value') else job.report.verdict,
            }
        
        history_data.append({
            "id": job.id,
            "document_title": job.source_doc.title if job.source_doc else "Unknown",
            "status": job.status.value if hasattr(job.status, 'value') else job.status,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "finished_at": job.finished_at.isoformat() if job.finished_at else None,
            "report": report_data
        })

    return {
        "status": "success",
        "history": history_data
    }