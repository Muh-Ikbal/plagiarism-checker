import os
import re
from typing import List, Dict

def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Menghitung jarak edit (Levenshtein Distance) antara dua string murni tanpa library.
    Berapa banyak operasi insert, delete, atau substitute yang dibutuhkan.
    """
    if len(s1) > len(s2):
        s1, s2 = s2, s1
        
    distances = range(len(s1) + 1)
    for i2, c2 in enumerate(s2):
        distances_ = [i2 + 1]
        for i1, c1 in enumerate(s1):
            if c1 == c2:
                distances_.append(distances[i1])
            else:
                distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
        distances = distances_
    return distances[-1]

class SpellCheckerService:
    def __init__(self, max_edit_distance=2):
        self.max_edit_distance = max_edit_distance
        
        # Menyimpan kata asli dan frekuensinya -> { "skripsi": 150, ... }
        self.dictionary = {} 
        
        # Menyimpan variasi kata yang hurufnya dihapus -> { "skipsi": ["skripsi"], "kripsi": ["skripsi"] }
        self.deletes = {}    
        self.is_loaded = False

    def _get_deletes_variations(self, word: str) -> set:
        """
        Fungsi internal untuk menghasilkan semua variasi string dengan 
        menghapus 1 hingga max_edit_distance karakter.
        """
        deletes = set()
        queue = [word]
        
        for _ in range(self.max_edit_distance):
            temp_queue = []
            for w in queue:
                if len(w) > 1:
                    for i in range(len(w)):
                        # Menghapus karakter pada index i
                        del_word = w[:i] + w[i+1:]
                        if del_word not in deletes:
                            deletes.add(del_word)
                            temp_queue.append(del_word)
            queue = temp_queue
            
        return deletes

    def load_dictionary(self, dict_path: str, force_reload: bool = False):
        """Memuat file kamus dan memproses Symmetric Delete secara manual."""
        if force_reload:
            self.dictionary.clear()
            self.deletes.clear()
            self.is_loaded = False
            
        if not self.is_loaded:
            if os.path.exists(dict_path):
                with open(dict_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        # PERBAIKAN DI SINI: Pecah berdasarkan koma atau spasi
                        parts = re.split(r'[,\s;]+', line.strip())
                        
                        if len(parts) >= 2 and parts[0]:
                            word = parts[0].lower() # Pastikan huruf kecil
                            try:
                                count = int(parts[1])
                            except ValueError:
                                continue

                            # 1. Simpan ke dictionary utama
                            self.dictionary[word] = count

                            # 2. Pre-komputasi (Symmetric Delete)
                            delete_variations = self._get_deletes_variations(word)
                            delete_variations.add(word)

                            # 3. Masukkan variasi ke dalam index pencarian cepat
                            for del_str in delete_variations:
                                if del_str not in self.deletes:
                                    self.deletes[del_str] = []
                                self.deletes[del_str].append(word)

                self.is_loaded = True
                
                # TAMBAHAN DEBUGGING: Print jumlah kata yang berhasil dimuat
                print(f"✅ Kamus berhasil dimuat. Total kata di memori: {len(self.dictionary)} kata")
            else:
                print(f"❌ Peringatan: File kamus tidak ditemukan di {dict_path}")
    def get_suggestions(self, word: str, top_n: int = 5) -> List[str]:
        """Mencari N rekomendasi kata terbaik."""
        if not self.is_loaded:
            raise Exception("Kamus belum dimuat ke memori!")
        
        # Jika kata sudah benar, tidak perlu saran
        if word in self.dictionary:
            return []

        candidates = set()
        input_deletes = self._get_deletes_variations(word)
        input_deletes.add(word)

        for del_str in input_deletes:
            if del_str in self.deletes:
                for candidate in self.deletes[del_str]:
                    candidates.add(candidate)

        valid_candidates = []
        for cand in candidates:
            dist = levenshtein_distance(word, cand)
            if dist <= self.max_edit_distance:
                # Simpan (jarak, frekuensi, kata)
                valid_candidates.append((dist, self.dictionary.get(cand, 0), cand))

        if valid_candidates:
            # Urutkan: Jarak terkecil dahulu, lalu Frekuensi terbesar
            valid_candidates.sort(key=lambda x: (x[0], -x[1]))
            
            # Ambil N kata teratas
            return [cand[2] for cand in valid_candidates[:top_n]]

        return []
# Object singleton
spell_checker = SpellCheckerService(max_edit_distance=2)