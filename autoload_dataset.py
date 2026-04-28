import os
import requests
import time

# 1. Sesuaikan dengan URL API FastAPI kamu
API_URL = "http://localhost:8000/api/plagiarism/upload-reference"

# 2. Folder tempat kamu menyimpan ratusan PDF referensi
DATASET_FOLDER = "../database_jurnal/jurnal_pendidikan" 

def run_auto_upload():
    print(f"🚀 Memulai upload otomatis dari folder: {DATASET_FOLDER}")
    
    # Ambil semua file berakhiran .pdf
    pdf_files = [f for f in os.listdir(DATASET_FOLDER) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("⚠️ Tidak ada file PDF di folder tersebut!")
        return

    sukses = 0
    gagal = 0

    for filename in pdf_files:
        file_path = os.path.join(DATASET_FOLDER, filename)
        
        # Buka file dan tembak ke API
        with open(file_path, "rb") as file_data:
            files = {"file": (filename, file_data, "application/pdf")}
            
            # Form data sesuai yang diminta endpoint upload-reference
            payload = {
                "title": filename.replace(".pdf", ""), # Nama file jadi judul
                "user_id": 1 # ID Admin
            }
            
            try:
                response = requests.post(API_URL, files=files, data=payload)
                if response.status_code == 200:
                    print(f"✅ [SUKSES] {filename}")
                    sukses += 1
                else:
                    print(f"❌ [GAGAL] {filename} - Error: {response.text}")
                    gagal += 1
            except Exception as e:
                print(f"❌ [ERROR SERVER] {filename} - {str(e)}")
                gagal += 1
                
        # Beri jeda 1 detik antar file agar server/CPU tidak meledak kaget
        time.sleep(1)

    print("\n" + "="*30)
    print(f"🎉 PROSES SELESAI!")
    print(f"Total Sukses : {sukses} dokumen")
    print(f"Total Gagal  : {gagal} dokumen")
    print("="*30)

if __name__ == "__main__":
    run_auto_upload()