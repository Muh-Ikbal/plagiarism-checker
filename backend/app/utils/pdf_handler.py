import fitz  # PyMuPDF
import nltk
from typing import List, Dict
import re

import subprocess
import os

# Download model pemecah kalimat (hanya dieksekusi sekali saat server jalan)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')
# Tambahkan parameter exclude_bibliography dengan nilai default False
def extract_text_and_coords(pdf_path: str, exclude_bibliography: bool = False) -> List[Dict]:
    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        extracted_data = []
        stop_parsing = False

        for page_num in range(total_pages):
            if stop_parsing: 
                break
                
            page = doc.load_page(page_num)
            blocks = page.get_text("blocks")
            
            for b in blocks:
                if b[6] == 0:  # Hanya proses teks
                    raw_text = b[4].strip()
                    if not raw_text: 
                        continue
                    
                    if exclude_bibliography:
                        # --- PENGAMAN 1: ANTI DAFTAR ISI (TITIK-TITIK) ---
                        # Jika teks mengandung 3 titik beruntun (contoh: "...."), 
                        # ini dipastikan baris dari Daftar Isi. Langsung abaikan!
                        if re.search(r'\.{3,}', raw_text):
                            continue

                        # 1. Ambil 80 karakter pertama saja (untuk antisipasi teks tergabung)
                        raw_header_prefix = raw_text[:80].replace('\n', ' ').lower().strip()
                        
                        # 2. Bersihkan tanda baca
                        clean_header = re.sub(r'[^a-z0-9\s]', '', raw_header_prefix)
                        clean_header = " ".join(clean_header.split())
                        
                        # --- PENGAMAN 2: ANTI DAFTAR ISI (NOMOR HALAMAN) ---
                        # Jika teks bersihnya diakhiri oleh angka (contoh: "daftar pustaka 104")
                        if re.search(r'\d+$', clean_header):
                            continue
                        
                        # 3. Regex Utama: Hanya peduli apakah teks "DIMULAI DENGAN" daftar pustaka
                        pattern = r"^((bab\s+[a-z0-9]+\s+)|([a-z0-9]+\s+))?(daftar pustaka|referensi|bibliography|references)"
                        
                        # --- PENGAMAN 3: BATAS HALAMAN 60% ---
                        # Mencegah terhentinya proses di halaman-halaman awal (area Daftar Isi)
                        is_near_end = (page_num + 1) / total_pages > 0.6
                        
                        # 4. Gunakan re.match (otomatis mendeteksi kecocokan dari ujung depan teks)
                        if is_near_end and re.match(pattern, clean_header):
                            print(f"🚩 Judul Referensi Terdeteksi Akurat di hal {page_num+1}. Ekstraksi dihentikan.")
                            stop_parsing = True
                            break
                    
                    # --- Lanjut Proses Normal ---
                    clean_text = " ".join(raw_text.split()) 
                    if len(clean_text) < 15: 
                        continue
                    
                    sentences = nltk.sent_tokenize(clean_text)
                    for sent in sentences:
                        if len(sent) > 10:
                            extracted_data.append({
                                "page": page_num,
                                "text": sent, 
                                "bbox": [b[0], b[1], b[2], b[3]] 
                            })
                            
        doc.close()
        return extracted_data
    except Exception as e:
        print(f"Error Ekstraksi PDF: {str(e)}")
        return []

def convert_docx_to_pdf(docx_path: str, output_folder: str):
    """
    Mengonversi file DOCX ke PDF menggunakan LibreOffice.
    """
    try:
        # Perintah terminal: libreoffice --headless --convert-to pdf --outdir [folder] [file]
        command = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            output_folder,
            docx_path
        ]
        
        subprocess.run(command, check=True)
        
        # Ambil nama file pdf hasil konversi
        base_name = os.path.basename(docx_path).replace(".docx", ".pdf")
        pdf_path = os.path.join(output_folder, base_name)
        
        return pdf_path
    except Exception as e:
        print(f"Konversi Gagal: {str(e)}")
        return None