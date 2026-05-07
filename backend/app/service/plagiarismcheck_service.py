import os
import joblib
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class PlagiarismService:
    def __init__(self):
        # Tentukan lokasi penyimpanan file model
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(self.base_dir, "data")
        
        # File .pkl untuk menyimpan cara memecah kata (Vocabulary & IDF weights)
        self.vectorizer_path = os.path.join(self.data_dir, "tfidf_vectorizer.pkl")
        
        # File .npz untuk menyimpan matriks TF-IDF seluruh database (Sangat hemat memori)
        self.matrix_path = os.path.join(self.data_dir, "corpus_matrix.npz")
        
        self.vectorizer = None
        self.corpus_matrix = None
        
        # Coba muat model jika sudah pernah dibuat sebelumnya
        self.load_model()

    def load_model(self):
        """Memuat vectorizer dan matriks ke dalam RAM jika file fisiknya ada."""
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.matrix_path):
            self.vectorizer = joblib.load(self.vectorizer_path)
            self.corpus_matrix = sparse.load_npz(self.matrix_path)
            print(f"✅ Model Plagiarisme dimuat! Ukuran matriks: {self.corpus_matrix.shape}")
        else:
            print("⚠️ Peringatan: Model Plagiarisme belum dilatih (Data referensi kosong).")

    def train_and_save_model(self, database_sentences: list[str]):
        """
        Dijalankan SETIAP KALI ada dokumen referensi baru yang diunggah.
        Membangun ulang matriks dari nol dan menyimpannya ke hard disk.
        """
        if not database_sentences:
            return

        print("Memulai proses training TF-IDF...")
        
        # 1. Inisialisasi dan latih Vectorizer baru
        self.vectorizer = TfidfVectorizer(lowercase=True,ngram_range=(1, 2))
        self.corpus_matrix = self.vectorizer.fit_transform(database_sentences)
        
        # 2. Simpan ke file statis (agar tidak hilang saat server restart)
        joblib.dump(self.vectorizer, self.vectorizer_path)
        sparse.save_npz(self.matrix_path, self.corpus_matrix)
        
        print(f"✅ Training Selesai! Disimpan ke {self.data_dir}")

    def check_sentence_similarity(self, query_sentence: str, db_sentence_ids: list[int], threshold: float = 0.5) -> list:
        """
        Membandingkan 1 kalimat skripsi dengan seluruh database referensi.
        Mengembalikan list ID kalimat di database yang mirip beserta persentasenya.
        
        Argumen:
        - db_sentence_ids: List ID dari tabel `sentences` yang urutannya SAMA PERSIS 
                           dengan urutan saat training (sangat penting!).
        """
        if self.vectorizer is None or self.corpus_matrix is None:
            raise Exception("Model belum dilatih. Tidak bisa melakukan pengecekan.")

        # 1. Ubah kalimat baru menjadi vektor angka
        query_vector = self.vectorizer.transform([query_sentence])

        # 2. Hitung Cosine Similarity secara instan (menggunakan perkalian matriks)
        # Hasilnya adalah array 1D berisi nilai 0.0 - 1.0 untuk setiap dokumen
        similarities = cosine_similarity(query_vector, self.corpus_matrix)[0]

        # 3. Filter hanya yang di atas batas threshold (misal > 50%)
        suspicious_matches = []
        for index, score in enumerate(similarities):
            if score >= threshold:
                suspicious_matches.append({
                    "target_sentence_id": db_sentence_ids[index],
                    "similarity_pct": round(float(score) * 100, 2)
                })

        # Urutkan dari yang paling mirip (menurun)
        suspicious_matches.sort(key=lambda x: x["similarity_pct"], reverse=True)
        return suspicious_matches
    
    def check_batch_similarity(self, query_sentences: list[str], db_sentence_ids: list[int], threshold: float = 0.5) -> list:
        """
        OPTIMASI BATCH: Menerima banyak kalimat sekaligus dan mengeceknya dalam 1 kali hitung.
        """
        if self.vectorizer is None or self.corpus_matrix is None:
            raise Exception("Model belum dilatih.")

        # 1. Transformasi SEMUA kalimat skripsi sekaligus jadi satu matriks besar
        query_vectors = self.vectorizer.transform(query_sentences)

        # 2. Kalikan matriks skripsi dengan matriks database dalam SATU tarikan nafas!
        # Hasilnya adalah matriks 2D berisi skor kemiripan
        similarities = query_vectors.dot(self.corpus_matrix.T).toarray()

        # 3. Filter hasilnya
        batch_results = []
        for i, sim_array in enumerate(similarities):
            suspicious_matches = []
            for j, score in enumerate(sim_array):
                if score >= threshold:
                    suspicious_matches.append({
                        "target_sentence_id": db_sentence_ids[j],
                        "similarity_pct": round(float(score) * 100, 2)
                    })
            suspicious_matches.sort(key=lambda x: x["similarity_pct"], reverse=True)
            batch_results.append(suspicious_matches)
            
        return batch_results
# Inisialisasi service agar jadi Singleton
plagiarism_checker = PlagiarismService()