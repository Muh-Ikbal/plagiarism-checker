import os
import re
import math
import joblib
import numpy as np
from scipy import sparse
from collections import Counter, defaultdict


class ManualTfidfVectorizer:
    """
    Implementasi TF-IDF manual tanpa Scikit-Learn.
    Dibuat khusus untuk Skripsi agar hasil matematisnya 100%
    sama dengan library TfidfVectorizer(ngram_range=(1, 2)).
    """

    def __init__(self):
        self.vocab = {}  # Memetakan kata -> index kolom
        self.idf = {}  # Menyimpan bobot IDF tiap kata
        self.vocab_size = 0

    def _tokenize(self, text: str) -> list:
        """
        Memecah kalimat menjadi Unigram (1 kata) dan Bigram (2 kata berurutan).
        Sama persis dengan regex standar Scikit-Learn: (?u)\b\w\w+\b
        """
        # Ekstrak kata yang panjangnya minimal 2 huruf
        tokens = re.findall(r"(?u)\b\w\w+\b", text.lower())

        # Masukkan Unigram
        ngrams = list(tokens)

        # Masukkan Bigram (N-gram 1, 2)
        for i in range(len(tokens) - 1):
            ngrams.append(f"{tokens[i]} {tokens[i+1]}")

        return ngrams

    def fit_transform(self, sentences: list[str]) -> sparse.csr_matrix:
        """
        Melatih model: Menghitung Document Frequency (DF) dan Inverse Document Frequency (IDF).
        """
        N = len(sentences)
        df = defaultdict(int)

        # 1. Hitung DF (Berapa banyak dokumen yang mengandung kata X)
        for doc in sentences:
            unique_tokens = set(self._tokenize(doc))
            for token in unique_tokens:
                df[token] += 1

        # 2. Bangun Vocabulary dan Hitung Rumus Smooth IDF Scikit-Learn
        # Rumus: idf(t) = ln((1 + N) / (1 + df(t))) + 1
        self.vocab = {}
        self.idf = {}
        for idx, (term, freq) in enumerate(df.items()):
            self.vocab[term] = idx
            self.idf[term] = math.log((1 + N) / (1 + freq)) + 1

        self.vocab_size = len(self.vocab)

        # 3. Transformasi menjadi Matriks
        return self.transform(sentences)

    def transform(self, sentences: list[str]) -> sparse.csr_matrix:
        """
        Mengubah kalimat baru menjadi Vektor Angka (TF * IDF) yang sudah di-Normalisasi L2.
        """
        rows, cols, data = [], [], []

        for row_idx, doc in enumerate(sentences):
            tokens = self._tokenize(doc)
            tf_counter = Counter(tokens)

            doc_data = []
            doc_cols = []

            # Hitung TF * IDF untuk kalimat ini
            for term, tf_count in tf_counter.items():
                if term in self.vocab:
                    col_idx = self.vocab[term]
                    weight = tf_count * self.idf[term]
                    doc_cols.append(col_idx)
                    doc_data.append(weight)

            # L2 Normalization (Membagi setiap nilai dengan panjang vektor)
            # Rumus Panjang Vektor = sqrt(a^2 + b^2 + ...)
            norm = math.sqrt(sum(w**2 for w in doc_data))

            if norm > 0:
                for c, w in zip(doc_cols, doc_data):
                    rows.append(row_idx)
                    cols.append(c)
                    data.append(w / norm)  # Normalisasi L2

        return sparse.csr_matrix(
            (data, (rows, cols)), shape=(len(sentences), self.vocab_size)
        )


class PlagiarismService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(self.base_dir, "data")

        self.vectorizer_path = os.path.join(
            self.data_dir, "tfidf_vectorizer_manual.pkl"
        )
        self.matrix_path = os.path.join(self.data_dir, "corpus_matrix_manual.npz")

        self.vectorizer = None
        self.corpus_matrix = None

        self.load_model()

    def load_model(self):
        """Memuat vectorizer dan matriks ke dalam RAM jika file fisiknya ada."""
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.matrix_path):
            # Memuat state kamus (vocab dan idf)
            saved_state = joblib.load(self.vectorizer_path)
            self.vectorizer = ManualTfidfVectorizer()
            self.vectorizer.vocab = saved_state["vocab"]
            self.vectorizer.idf = saved_state["idf"]
            self.vectorizer.vocab_size = len(saved_state["vocab"])

            self.corpus_matrix = sparse.load_npz(self.matrix_path)
            print(
                f"Model Plagiarisme Manual dimuat! Ukuran matriks: {self.corpus_matrix.shape}"
            )
        else:
            print("Peringatan: Model Plagiarisme Manual belum dilatih.")

    def train_and_save_model(self, database_sentences: list[str]):
        """Membangun ulang matriks dari nol menggunakan code manual."""
        if not database_sentences:
            return

        print("Memulai proses training TF-IDF Manual...")

        self.vectorizer = ManualTfidfVectorizer()
        self.corpus_matrix = self.vectorizer.fit_transform(database_sentences)

        # Simpan vocab dan idf sebagai dictionary statis
        state_to_save = {"vocab": self.vectorizer.vocab, "idf": self.vectorizer.idf}
        joblib.dump(state_to_save, self.vectorizer_path)
        sparse.save_npz(self.matrix_path, self.corpus_matrix)

    def check_sentence_similarity(
        self, query_sentence: str, db_sentence_ids: list[int], threshold: float = 0.5
    ) -> list:
        if self.vectorizer is None or self.corpus_matrix is None:
            raise Exception("Model belum dilatih.")

        # 1. Ubah kalimat baru menjadi vektor menggunakan manual transformer
        query_vector = self.vectorizer.transform([query_sentence])

        # 2. Hitung Cosine Similarity Manual
        # Karena kedua vektor (query dan corpus) SUDAH di-normalisasi L2 pada saat transform(),
        # perhitungan Cosine Similarity A . B / (|A| * |B|) menyusut menjadi perkalian dot matriks biasa (A . B^T)
        similarities = query_vector.dot(self.corpus_matrix.T).toarray()[0]

        suspicious_matches = []
        for index, score in enumerate(similarities):
            if score >= threshold:
                suspicious_matches.append(
                    {
                        "target_sentence_id": db_sentence_ids[index],
                        "similarity_pct": round(float(score) * 100, 2),
                    }
                )

        suspicious_matches.sort(key=lambda x: x["similarity_pct"], reverse=True)
        return suspicious_matches


# Inisialisasi service agar jadi Singleton
plagiarism_checker = PlagiarismService()
