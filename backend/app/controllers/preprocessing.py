"""
Preprocessing NLP — Normalisasi, noise removal, tokenisasi, stemming.

Pipeline:
  Sentence Segmentation → **Preprocessing NLP** → **Tokenization** → TF-IDF
"""

import re
import unicodedata
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

factory = StemmerFactory()
stemmer = factory.create_stemmer()

STOPWORDS = set([
    "yang","dan","di","ke","dari","untuk","dengan","atau","pada",
    "sebagai","karena","adalah","itu","ini","bahwa","oleh","akan",
    "ada","juga","jika","maka","saat","telah","sudah","belum",
    "saya","kami","kita","anda","dia","mereka","ia","nya",
    "sangat","lebih","paling","cukup","hanya","saja","sekali",
    "penelitian","peneliti","hasil","pembahasan","tujuan",
    "dalam","metode","metodologi","kajian","data","dapat",
    "jurnal","artikel","literatur","analisis","berdasarkan",
    "menurut","terhadap","tentang","melalui","secara"
])


def normalize_text(text: str) -> str:
    """Step 4a: Normalisasi unicode dan lowercase."""
    text = unicodedata.normalize("NFKD", text)
    text = text.lower()
    return text


def remove_noise(text: str) -> str:
    """Step 4b: Hapus noise (referensi, DOI, angka, simbol)."""
    text = re.sub(r"\[[0-9]+\]", " ", text)
    text = re.sub(r"doi:\s*[\w\.\-/]+", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"[0-9]+", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> list[str]:
    """Step 5: Tokenisasi — pecah teks menjadi kata-kata."""
    return text.split()


def stem_and_filter(tokens: list[str], min_token_len: int = 3) -> list[str]:
    """Step 5b: Stemming + filter stopword dan token pendek."""
    # Stemming terlebih dahulu
    tokens = [stemmer.stem(t) for t in tokens]
    # Filter: stopword + panjang minimum
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) >= min_token_len]
    return tokens


def preprocess(text: str, min_token_len: int = 3) -> list[str]:
    """
    Full preprocessing pipeline (backward compatible).
    Normalisasi → Noise Removal → Tokenisasi → Stemming + Filter
    """
    text = normalize_text(text)
    text = remove_noise(text)
    tokens = tokenize(text)
    tokens = stem_and_filter(tokens, min_token_len)
    return tokens