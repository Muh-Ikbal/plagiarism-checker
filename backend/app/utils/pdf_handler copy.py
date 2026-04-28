import fitz  # PyMuPDF
from typing import List, Dict

def extract_text_and_coords(pdf_path: str) -> List[Dict]:
    """
    Mengekstrak teks dari file PDF beserta letak koordinat spasialnya (Bounding Box).
    Koordinat ini akan digunakan untuk menggambar highlight/stabilo pada PDF laporan.
    
    Returns:
        List of Dictionary berisi page (halaman), text (teks mentah), dan bbox (koordinat).
    """
    try:
        doc = fitz.open(pdf_path)
        extracted_data = []

        # Looping untuk setiap halaman di dalam PDF
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # get_text("blocks") mengembalikan list tuple untuk setiap blok paragraf/elemen
            # Format: (x0, y0, x1, y1, "text", block_no, block_type)
            blocks = page.get_text("blocks")
            
            for b in blocks:
                # block_type == 0 artinya ini adalah teks (bukan gambar/vektor)
                if b[6] == 0:
                    # Bersihkan spasi kosong berlebih dan karakter enter/newline
                    raw_text = b[4].strip()
                    raw_text = " ".join(raw_text.split()) 
                    
                    # Abaikan teks yang terlalu pendek (biasanya nomor halaman, footer, atau noise)
                    if len(raw_text) < 15:
                        continue
                        
                    # Simpan koordinat (x0, y0, x1, y1)
                    bbox = [b[0], b[1], b[2], b[3]]
                    
                    extracted_data.append({
                        "page": page_num,
                        "text": raw_text,
                        "bbox": bbox
                    })
                    
        doc.close()
        return extracted_data
        
    except Exception as e:
        print(f"Error saat mengekstrak PDF {pdf_path}: {str(e)}")
        # Mengembalikan list kosong jika gagal agar tidak merusak pipeline utama
        return []