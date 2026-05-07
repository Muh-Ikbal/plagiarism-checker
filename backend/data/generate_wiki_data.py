import urllib.request
import urllib.parse
import json
import re
import csv
import random

def get_wiki_text(page_title):
    try:
        url = f"https://id.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles={urllib.parse.quote(page_title)}&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data['query']['pages']
            for page_id in pages:
                if 'extract' in pages[page_id]:
                    return pages[page_id]['extract']
    except Exception as e:
        print(f"Gagal mengambil artikel {page_title}: {e}")
    return ""

def is_valid_sentence(text):
    """Filter kalimat agar hanya yang substantif dan berkualitas tinggi."""
    text = text.strip()
    
    # Tolak kalimat terlalu pendek atau terlalu panjang
    words = text.split()
    if len(words) < 10 or len(words) > 60:
        return False
    
    # Tolak referensi bibliografi & metadata Wikipedia
    junk_patterns = [
        r'ISBN',
        r'Diarsipkan',
        r'Wayback Machine',
        r'dalam bahasa Inggris',
        r'dalam bahasa',
        r'\(PDF\)',
        r'http[s]?://',
        r'www\.',
        r'Edisi \d',
        r'Pemeliharaan CS1',
        r'Wikimedia',
        r'OpenStreetMap',
        r'Situs web resmi',
        r'University Press',
        r'Palgrave',
        r'Stanford',
        r'Centre for Strategic',
        r'\(link\)',
    ]
    for pattern in junk_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    
    # Tolak kalimat yang mengandung newline (fragmen terpotong)
    if '\n' in text:
        return False
    
    # Tolak kalimat yang hanya berisi angka dan tanda baca
    alpha_chars = sum(1 for c in text if c.isalpha())
    if alpha_chars < len(text) * 0.5:
        return False
        
    # Tolak kalimat yang dimulai dengan angka atau tanda kurung saja (sering fragmen)
    if re.match(r'^\d+[\.\)]\s', text):
        return False
        
    # Tolak kalimat yang berisi format daftar/list
    if re.match(r'^[\-\*\•]', text):
        return False
    
    return True

def clean_and_split(text):
    """Ekstrak kalimat berkualitas dari teks Wikipedia."""
    # Hapus section headers seperti == Header ==
    text = re.sub(r'==+.*?==+', '', text)
    # Hapus kutipan atau tanda kurung referensi
    text = re.sub(r'\[\d+\]', '', text)
    # Hapus referensi dalam kurung ganda
    text = re.sub(r'\{\{.*?\}\}', '', text)
    
    # Split by period
    raw_sentences = [s.strip() + "." for s in text.split('.') if len(s.strip()) > 50]
    
    # Filter hanya kalimat yang berkualitas
    valid_sentences = [s for s in raw_sentences if is_valid_sentence(s)]
    return valid_sentences


# =============================================================================
# FUNGSI MODIFIKASI PLAGIAT BERTINGKAT
# =============================================================================

SYNONYMS = {
    "adalah": "merupakan",
    "merupakan": "yaitu",
    "dengan": "menggunakan",
    "untuk": "guna",
    "bahwa": "kalau",
    "sangat": "amat",
    "besar": "raksasa",
    "kecil": "mini",
    "cepat": "kilat",
    "memiliki": "mempunyai",
    "bisa": "dapat",
    "dapat": "mampu",
    "seperti": "bagaikan",
    "pada": "di",
    "saat": "ketika",
    "setelah": "sesudah",
    "karena": "sebab",
    "berbagai": "macam-macam",
    "bagian": "porsi",
    "sering": "kerap",
    "juga": "pun",
    "atau": "ataupun",
    "tetapi": "namun",
    "namun": "akan tetapi",
    "serta": "dan juga",
    "oleh": "lewat",
    "dari": "berasal dari",
    "dalam": "di dalam",
    "antara": "di antara",
    "seluruh": "semua",
    "semua": "segala",
    "beberapa": "sejumlah",
    "sejumlah": "beberapa",
    "pertama": "yang pertama",
    "terhadap": "kepada",
    "melalui": "lewat",
    "hingga": "sampai",
    "sejak": "semenjak",
    "masih": "tetap",
}

def _replace_synonym(word, probability=0.7):
    """Ganti kata dengan sinonim jika ada, dengan probabilitas tertentu."""
    lw = word.lower()
    if lw in SYNONYMS and random.random() < probability:
        replacement = SYNONYMS[lw]
        if word.istitle():
            return replacement.title()
        return replacement
    return word

def _swap_adjacent_words(words, num_swaps=1):
    """Tukar posisi kata-kata yang berdekatan."""
    result = words.copy()
    for _ in range(num_swaps):
        if len(result) > 3:
            idx = random.randint(1, len(result) - 2)
            result[idx], result[idx + 1] = result[idx + 1], result[idx]
    return result

def _shuffle_clauses(sentence):
    """Tukar urutan klausa dalam kalimat (dipisah koma)."""
    # Pisah berdasarkan koma
    parts = [p.strip() for p in sentence.replace('.', '').split(',') if p.strip()]
    if len(parts) >= 2:
        # Tukar 2 klausa secara acak
        i, j = random.sample(range(len(parts)), 2)
        parts[i], parts[j] = parts[j], parts[i]
        return ', '.join(parts) + '.'
    return sentence

def _remove_random_words(words, ratio=0.15):
    """Hapus beberapa kata secara acak (simulasi penghapusan informasi)."""
    result = []
    for w in words:
        # Jangan hapus kata pertama dan terakhir
        if random.random() > ratio or w == words[0] or w == words[-1]:
            result.append(w)
    return result if len(result) > 5 else words

def _add_filler_words(words):
    """Tambahkan kata-kata pengisi di posisi acak."""
    fillers = ["yang", "ini", "itu", "tersebut", "sendiri", "juga", "pun", "bahkan"]
    result = words.copy()
    num_inserts = random.randint(1, 2)
    for _ in range(num_inserts):
        if len(result) > 3:
            idx = random.randint(1, len(result) - 1)
            result.insert(idx, random.choice(fillers))
    return result


def modify_level_ringan(sentence):
    """
    Level RINGAN (copy-paste minor edit): 
    Hanya ganti 1-2 sinonim. Skor diharapkan: 85-100%
    """
    words = sentence.replace('.', '').split()
    if len(words) < 5:
        return sentence
    
    new_words = [_replace_synonym(w, probability=0.3) for w in words]
    return " ".join(new_words) + "."


def modify_level_sedang(sentence):
    """
    Level SEDANG (parafrase ringan):
    Ganti banyak sinonim + tukar urutan kata/klausa. Skor diharapkan: 50-75%
    """
    words = sentence.replace('.', '').split()
    if len(words) < 5:
        return sentence
    
    # 1. Ganti banyak sinonim (probabilitas tinggi)
    new_words = [_replace_synonym(w, probability=0.8) for w in words]
    
    # 2. Tukar beberapa kata berdekatan
    new_words = _swap_adjacent_words(new_words, num_swaps=2)
    
    # 3. Kadang tukar klausa
    result = " ".join(new_words) + "."
    if random.random() > 0.4:
        result = _shuffle_clauses(result)
    
    return result


def modify_level_berat(sentence):
    """
    Level BERAT (parafrase berat):
    Restrukturisasi signifikan. Skor diharapkan: 25-50%
    """
    words = sentence.replace('.', '').split()
    if len(words) < 5:
        return sentence
    
    # 1. Ganti semua sinonim yang tersedia
    new_words = [_replace_synonym(w, probability=1.0) for w in words]
    
    # 2. Hapus beberapa kata (mengurangi overlap token)
    new_words = _remove_random_words(new_words, ratio=0.2)
    
    # 3. Tambahkan kata pengisi
    new_words = _add_filler_words(new_words)
    
    # 4. Tukar beberapa pasang kata
    new_words = _swap_adjacent_words(new_words, num_swaps=3)
    
    # 5. Tukar klausa
    result = " ".join(new_words) + "."
    result = _shuffle_clauses(result)
    
    return result


def generate_datasets():
    print("Mengambil data dari Wikipedia Bahasa Indonesia...")
    
    # Topik akademik yang relevan dengan konteks skripsi
    academic_topics = [
        "Kecerdasan_buatan", "Indonesia", "Fisika", "Biologi", 
        "Ekonomi", "Bumi", "Komputer", "Internet", "Politik", 
        "Sejarah", "Matematika", "Kimia", "Teknologi", "Pendidikan",
        "Kesehatan", "Energi", "Geografi", "Astronomi",
        "Sistem_informasi", "Rekayasa_perangkat_lunak", "Algoritma",
        "Jaringan_komputer", "Basis_data", "Statistika", "Linguistik",
        "Filsafat", "Sosiologi", "Psikologi", "Hukum", "Sastra",
    ]
    
    all_sentences = []
    for topic in academic_topics:
        text = get_wiki_text(topic)
        sents = clean_and_split(text)
        all_sentences.extend(sents)
        print(f"  - {topic}: {len(sents)} kalimat valid")
        if len(all_sentences) >= 600:
            break
            
    # Deduplikasi (hapus kalimat identik)
    all_sentences = list(dict.fromkeys(all_sentences))  # Preserves order
    print(f"\nTotal kalimat valid setelah deduplikasi: {len(all_sentences)}")
    
    if len(all_sentences) < 400:
        print("PERINGATAN: Kalimat kurang dari 400. Tambahkan topik di academic_topics.")
        print("Melanjutkan dengan data yang ada...")
    
    # =================================================================
    # STRATEGI PEMBAGIAN DATA
    # =================================================================
    
    # 1. CORPUS: 200 kalimat pertama → database referensi
    corpus_sentences = all_sentences[:200]
    corpus_set = set(corpus_sentences)
    
    # 2. LABEL 0 (BERSIH): Kalimat BERBEDA yang BUKAN ada di corpus
    #    Filter ketat: pastikan tidak ada duplikasi dengan corpus
    clean_candidates = [s for s in all_sentences[200:] if s not in corpus_set]
    clean_sentences = clean_candidates[:100]
    
    if len(clean_sentences) < 100:
        print(f"PERINGATAN: Hanya {len(clean_sentences)} kalimat bersih tersedia.")
    
    # 3. LABEL 1 (PLAGIAT): Modifikasi bertingkat dari kalimat corpus
    #    Distribusi: 34 ringan + 33 sedang + 33 berat = 100
    plagiarized_sources = random.sample(corpus_sentences, min(100, len(corpus_sentences)))
    
    num_ringan = 34
    num_sedang = 33
    num_berat = 33
    
    # =================================================================
    # EXPORT KE CSV
    # =================================================================
    
    # Buat CSV Corpus
    print(f"\nMenyimpan {len(corpus_sentences)} data korpus...")
    with open("backend/data/eval_corpus.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "text"])
        for i, sent in enumerate(corpus_sentences):
            writer.writerow([i+1, sent])
            
    # Buat CSV Test
    print("Membuat data uji bertingkat...")
    test_data = []
    
    # --- Label 1: PLAGIAT bertingkat ---
    for idx, sent in enumerate(plagiarized_sources):
        if idx < num_ringan:
            modified = modify_level_ringan(sent)
            level = "ringan"
        elif idx < num_ringan + num_sedang:
            modified = modify_level_sedang(sent)
            level = "sedang"
        else:
            modified = modify_level_berat(sent)
            level = "berat"
        test_data.append([modified, 1, level])
        
    # --- Label 0: BERSIH ---
    for sent in clean_sentences:
        test_data.append([sent, 0, "-"])
        
    # Acak urutan
    random.shuffle(test_data)
    
    with open("backend/data/eval_test.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label", "level_modifikasi"])
        for row in test_data:
            writer.writerow(row)
    
    # Statistik akhir
    total_plagiat = sum(1 for r in test_data if r[1] == 1)
    total_bersih = sum(1 for r in test_data if r[1] == 0)
    
    print(f"\n{'='*60}")
    print(f"RINGKASAN DATASET")
    print(f"{'='*60}")
    print(f"  Corpus (referensi)  : {len(corpus_sentences)} kalimat")
    print(f"  Data uji total      : {len(test_data)} kalimat")
    print(f"    - Plagiat (label 1): {total_plagiat}")
    print(f"      • Ringan         : {num_ringan}")
    print(f"      • Sedang         : {num_sedang}")
    print(f"      • Berat          : {num_berat}")
    print(f"    - Bersih  (label 0): {total_bersih}")
    print(f"{'='*60}")
    print("Selesai!")

if __name__ == "__main__":
    generate_datasets()
