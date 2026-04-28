import math
import re
from collections import Counter
from .preprocessing import preprocess

class TFIDFEngine:
    def __init__(self):
        self.documents = []
        self.df = Counter()  # Document frequency
        self.idf = {}
        self.vocab = []
        self.vocab_index = {}
    
    def add_document(self, raw_text: str):
        """Tambahkan dokumen baru"""
        tokens = preprocess(raw_text)
        self.documents.append(tokens)
    
    def rebuild_idf(self):
        """Hitung ulang IDF dari semua dokumen"""
        # Reset document frequency
        self.df = Counter()
        
        # Hitung DF untuk setiap term
        for tokens in self.documents:
            for term in set(tokens):  # set() agar 1 term hanya dihitung 1x per dokumen
                self.df[term] += 1
        
        # Jumlah dokumen
        N = len(self.documents)
        
        # Buat vocabulary
        self.vocab = sorted(self.df.keys())
        self.vocab_index = {t: i for i, t in enumerate(self.vocab)}
        
        # Hitung IDF: log((N+1)/(df+1)+1)
        self.idf = {
            term: math.log((N + 1) / (df + 1) + 1)
            for term, df in self.df.items()
        }
    
    def vectorize(self, tokens):
        """Convert tokens menjadi TF-IDF vector"""
        # Hitung TF (Term Frequency)
        tf = Counter(tokens)
        L = len(tokens) if len(tokens) > 0 else 1  # Avoid division by zero
        
        # Inisialisasi vector dengan 0
        vec = [0.0] * len(self.vocab)  #  PERBAIKAN: 0.0 bukan 0*0
        
        # Hitung TF-IDF untuk setiap term
        for term, count in tf.items():  #  PERBAIKAN: tambah ()
            if term in self.vocab_index:  #  PERBAIKAN: cek term ada di vocab
                idx = self.vocab_index[term]
                # TF-IDF = (count/L) * IDF
                vec[idx] = (count / L) * self.idf.get(term, 0)
        
        return vec
    
    def vectorize_all(self):
        """Vectorize semua dokumen"""
        return [self.vectorize(tokens) for tokens in self.documents]