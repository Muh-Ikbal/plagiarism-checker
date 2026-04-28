"""
Admin Router — Endpoint untuk admin mengelola dokumen repository.

Pipeline Upload:
  1. Validasi Format File
  2. Extract Text
  3. Sentence Segmentation (NLTK)
  4-5. Preprocessing NLP + Tokenization (per kalimat)
  6. TF-IDF Vectorization (disimpan ke DB)
  7-8. Simpan ke Database → Dokumen Masuk Repository
"""

import math
from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.document import Document, DocType, DocStatus
from app.models.sentence import Sentence
from app.models.checkjob import CheckJob, JobStatus
from app.models.report import PlagiarismReport
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

MIN_SENTENCE_LENGTH = 10  # Karakter minimal agar kalimat dianggap valid


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Statistik dashboard admin."""
    total_docs = db.query(func.count(Document.id)).filter(
        Document.doc_type == DocType.reference
    ).scalar()

    total_sentences = db.query(func.count(Sentence.id)).scalar()

    indexed_docs = db.query(func.count(Document.id)).filter(
        Document.doc_type == DocType.reference,
        Document.status == DocStatus.indexed,
    ).scalar()

    total_checks = db.query(func.count(CheckJob.id)).scalar()

    return {
        "total_documents": total_docs,
        "indexed_documents": indexed_docs,
        "total_sentences": total_sentences,
        "total_checks": total_checks,
    }



@router.get("/history")
async def get_check_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Cari berdasarkan judul dokumen atau nama pengguna"),
    db: Session = Depends(get_db),
):
    """List semua riwayat pengecekan (CheckJobs) untuk History & Dashboard."""
    
    # 1. PERBAIKAN FATAL: Gunakan outerjoin untuk tabel User
    query = db.query(CheckJob)\
        .outerjoin(User, CheckJob.user_id == User.id)\
        .join(Document, CheckJob.source_doc_id == Document.id)
    
    if search:
        query = query.filter(
            (Document.title.ilike(f"%{search}%"))
            | (User.username.ilike(f"%{search}%"))
        )

    query = query.order_by(CheckJob.created_at.desc())
    
    total = query.count()
    jobs = query.offset((page - 1) * per_page).limit(per_page).all()

    history_data = []
    for job in jobs:
        # Format tanggal (misal: "23 April 2026, 14:30")
        date_str = job.created_at.strftime("%d %B %Y, %H:%M") if job.created_at else ""
        
        # Ambil skor jika ada report
        score = round(job.report.overall_similarity_pct, 2) if job.report and hasattr(job.report, 'overall_similarity_pct') else 0
        
        history_data.append({
            "id": job.id,
            # 2. PERBAIKAN UX: Ganti "Unknown" menjadi "Guest / Anonim"
            "user": job.requested_by.username if job.requested_by else "Guest / Anonim",
            # Jaga-jaga jika source_doc kosong (misal untuk pengecekan teks manual instan)
            "document": job.source_doc.title if job.source_doc else "Teks Manual",
            "date": date_str,
            "plagiarismScore": score,
            "status": job.status.value if hasattr(job.status, 'value') else job.status
        })

    return {
        "history": history_data,
        "total": total,
        "page": page,
        "per_page": per_page,
        # Math.ceil di Python menggunakan trik -(-a // b)
        "total_pages": max(1, -(-total // per_page)),
    }

