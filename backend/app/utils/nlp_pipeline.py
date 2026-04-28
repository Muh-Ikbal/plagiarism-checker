import re
import unicodedata



# Custom Stopwords untuk dokumen akademik
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

def clean_and_normalize(raw_text: str) -> str:
    """
    Pembersihan super ringan KHUSUS untuk masuk ke mesin pengecek ejaan (SymSpell).
    TIDAK MENGHAPUS stopwords agar konteks kalimat tetap utuh untuk dievaluasi.
    """
    if not raw_text:
        return ""

    # 1. Normalisasi unicode & lowercase
    text = unicodedata.normalize("NFKD", raw_text).lower()
    
    # 2. Hapus noise (referensi [1], angka, tanda baca)
    text = re.sub(r"\[[0-9]+\]", " ", text)
    text = re.sub(r"[0-9]+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    
    # 3. Kembalikan kalimat yang sudah bersih dari tanda baca (Stopwords tetap aman)
    clean_text = " ".join(text.split())
    return clean_text
# def clean_and_normalize(raw_text: str) -> str:
#     """
#     Membersihkan teks, menghapus noise, stopword, dan melakukan stemming.
#     Mengembalikan string bersih yang siap dimasukkan ke TfidfVectorizer.
#     """
#     if not raw_text:
#         return ""

#     # 1. Normalisasi unicode & lowercase
#     text = unicodedata.normalize("NFKD", raw_text).lower()
    
#     # 2. Hapus noise (referensi [1], angka, simbol)
#     text = re.sub(r"\[[0-9]+\]", " ", text)
#     text = re.sub(r"[0-9]+", " ", text)
#     text = re.sub(r"[^a-z\s]", " ", text)
    
#     # 3. Tokenisasi sederhana (split by space)
#     tokens = text.split()
    
#     # 4. Filter stopword & token pendek (< 3 huruf)
#     filtered_tokens = [t for t in tokens if t not in STOPWORDS and len(t) >= 3]
    
#     # 5. Stemming dengan Sastrawi
#     # (Perhatian: Proses ini agak memakan CPU)
#     stemmed_tokens = [stemmer.stem(t) for t in filtered_tokens]
    
#     # Gabungkan kembali menjadi kalimat
#     return " ".join(stemmed_tokens)

def clean_and_normalize_plagiarism(raw_text: str) -> str:
    """
    Membersihkan teks, menghapus noise dan stopword.
    (Versi TANPA Sastrawi Stemmer untuk menjaga konteks kalimat asli)
    """
    if not raw_text:
        return ""

    # 1. Normalisasi unicode & lowercase
    text = unicodedata.normalize("NFKD", raw_text).lower()
    
    # 2. Hapus noise (referensi [1], angka, simbol)
    text = re.sub(r"\[[0-9]+\]", " ", text)
    text = re.sub(r"[0-9]+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    
    # 3. Tokenisasi sederhana (split by space)
    tokens = text.split()
    
    # 4. Filter stopword & token pendek (< 3 huruf)
    # Tanpa proses Stemming, langsung digabungkan kembali
    filtered_tokens = [t for t in tokens if t not in STOPWORDS and len(t) >= 3]
    
    # Gabungkan kembali menjadi kalimat
    return " ".join(filtered_tokens)