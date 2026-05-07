import os
import sys
import csv
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, accuracy_score, recall_score, f1_score, precision_score

# Menambahkan root folder ke sys.path agar bisa import app.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.service.plagiarismcheck_test_service import PlagiarismService

def read_csv(file_path):
    """Membaca file CSV dan mengembalikan list of dictionaries."""
    data = []
    if not os.path.exists(file_path):
        return data
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def write_csv(file_path, fieldnames, data):
    """Menulis list of dictionaries ke file CSV."""
    with open(file_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def run_evaluation():
    print("="*60)
    print("PENGUJIAN ALGORITMA TF-IDF PLAGIARISM CHECKER (SKRIPSI)")
    print("="*60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    
    corpus_path = os.path.join(data_dir, "eval_corpus.csv")
    test_path = os.path.join(data_dir, "eval_test.csv")
    summary_out_path = os.path.join(data_dir, "eval_report_summary.csv")
    details_out_path = os.path.join(data_dir, "eval_report_details.csv")

    # ---------------------------------------------------------
    # 1. LOAD DATASET
    # ---------------------------------------------------------
    print("\n[1/4] Membaca dataset dari CSV...")
    if not os.path.exists(corpus_path) or not os.path.exists(test_path):
        print("Error: File dataset (eval_corpus.csv atau eval_test.csv) tidak ditemukan di direktori data/")
        print("Harap buat file tersebut terlebih dahulu sebelum menjalankan pengujian.")
        return

    corpus_data = read_csv(corpus_path)
    test_data = read_csv(test_path)

    reference_sentences = [row['text'] for row in corpus_data]
    ref_ids = [int(row['id']) for row in corpus_data]
    
    test_sentences = [row['text'] for row in test_data]
    y_true = [int(row['label']) for row in test_data]
    test_levels = [row.get('level_modifikasi', '-') for row in test_data]

    print(f"      - {len(reference_sentences)} dokumen referensi berhasil dimuat.")
    print(f"      - {len(test_sentences)} kalimat uji berhasil dimuat.")
    
    # Hitung distribusi level modifikasi
    level_counts = {}
    for lvl in test_levels:
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
    for lvl, cnt in level_counts.items():
        print(f"        • Level '{lvl}': {cnt} kalimat")

    # ---------------------------------------------------------
    # 2. INISIALISASI DAN LATIH MODEL (TEMPORARY)
    # ---------------------------------------------------------
    print("\n[2/4] Melatih model TF-IDF...")
    checker = PlagiarismService()
    
    # Training dan simpan model ke lokasi default service (app/data/)
    # File yang dihasilkan: tfidf_vectorizer_manual.pkl dan corpus_matrix_manual.npz
    checker.train_and_save_model(reference_sentences)
    print(f"      - Training Selesai. Model disimpan di: {checker.data_dir}")

    # ---------------------------------------------------------
    # 3. PENGUJIAN MULTI-THRESHOLD
    # ---------------------------------------------------------
    print("\n[3/4] Melakukan Prediksi & Evaluasi Multi-Threshold...")
    thresholds_to_test = [0.30, 0.40, 0.50, 0.60, 0.70,0.80,0.90]
    
    summary_results = []
    all_details = []

    for threshold in thresholds_to_test:
        print(f"      - Menguji Threshold {threshold*100:.0f}%...")
        
        batch_results = checker.check_batch_similarity(test_sentences, ref_ids, threshold)
        
        y_pred = []
        for i, matches in enumerate(batch_results):
            # 1 jika ada setidaknya 1 kecocokan di atas threshold, 0 jika tidak ada
            pred_label = 1 if len(matches) > 0 else 0
            y_pred.append(pred_label)
            
            status = "Benar" if y_true[i] == pred_label else "Salah"
            best_match_score = matches[0]["similarity_pct"] if matches else 0.0
            
            all_details.append({
                "Threshold": f"{threshold*100:.0f}%",
                "Teks Uji": test_sentences[i],
                "Level Modifikasi": test_levels[i],
                "Skor Kemiripan Tertinggi": best_match_score,
                "Label Asli (Ground Truth)": "Plagiat" if y_true[i] == 1 else "Bersih",
                "Prediksi Sistem": "Plagiat" if pred_label == 1 else "Bersih",
                "Status Prediksi": status
            })

        # Hitung Matriks Evaluasi
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1]) # Pastikan label [0, 1] agar output selalu 2x2
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        # Ekstrak dari Confusion Matrix (TN, FP, FN, TP)
        # Ingat: label 0 adalah negatif, label 1 adalah positif
        if cm.shape == (2,2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = 0, 0, 0, 0 # Fallback jika ukuran tidak sesuai (sangat jarang jika ada data campur)
        
        summary_results.append({
            "Threshold": f"{threshold*100:.0f}%",
            "Accuracy": f"{acc:.4f}",
            "Precision": f"{prec:.4f}",
            "Recall": f"{rec:.4f}",
            "F1-Score": f"{f1:.4f}",
            "True Positive": tp,
            "True Negative": tn,
            "False Positive": fp,
            "False Negative": fn
        })

        # --- Simpan Gambar Confusion Matrix ---
        plt.figure(figsize=(6, 4))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=['Bersih (0)', 'Plagiat (1)'], 
                    yticklabels=['Bersih (0)', 'Plagiat (1)'])
        plt.title(f'Confusion Matrix - Threshold {threshold*100:.0f}%')
        plt.ylabel('Label Asli')
        plt.xlabel('Prediksi Sistem')
        
        cm_image_path = os.path.join(data_dir, f'confusion_matrix_{threshold*100:.0f}.png')
        plt.savefig(cm_image_path, bbox_inches='tight')
        plt.close() # Tutup figure agar tidak menumpuk di memori

    # ---------------------------------------------------------
    # 4. EKSPOR HASIL KE CSV
    # ---------------------------------------------------------
    print("\n[4/4] Mengekspor Hasil Laporan...")
    write_csv(summary_out_path, fieldnames=["Threshold", "Accuracy", "Precision", "Recall", "F1-Score", "True Positive", "True Negative", "False Positive", "False Negative"], data=summary_results)
    print(f"      ✅ Ringkasan Evaluasi diekspor ke: {summary_out_path}")
    
    write_csv(details_out_path, fieldnames=["Threshold", "Teks Uji", "Level Modifikasi", "Skor Kemiripan Tertinggi", "Label Asli (Ground Truth)", "Prediksi Sistem", "Status Prediksi"], data=all_details)
    print(f"      ✅ Detail Prediksi diekspor ke: {details_out_path}")
    print(f"      ✅ Gambar Confusion Matrix (.png) untuk setiap threshold berhasil disimpan di: {data_dir}")

    # ---------------------------------------------------------
    # 5. TAMPILKAN TABEL KESIMPULAN DI TERMINAL
    # ---------------------------------------------------------
    print("\n" + "="*80)
    print("KESIMPULAN PENGUJIAN MULTI-THRESHOLD")
    print("="*80)
    print(f"{'Threshold':<12} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 63)
    for res in summary_results:
        print(f"{res['Threshold']:<12} | {res['Accuracy']:<10} | {res['Precision']:<10} | {res['Recall']:<10} | {res['F1-Score']:<10}")
    
    # Cari Threshold Terbaik (berdasarkan F1-Score)
    best_result = max(summary_results, key=lambda x: float(x["F1-Score"]))
    print(f"\n💡 REKOMENDASI UNTUK SKRIPSI: Threshold terbaik adalah {best_result['Threshold']} dengan F1-Score {best_result['F1-Score']}.")
    
    # ---------------------------------------------------------
    # 6. ANALISIS PER LEVEL MODIFIKASI (untuk threshold terbaik)
    # ---------------------------------------------------------
    best_threshold = float(best_result['Threshold'].replace('%','')) / 100
    best_batch = checker.check_batch_similarity(test_sentences, ref_ids, best_threshold)
    
    print(f"\n{'='*80}")
    print(f"ANALISIS PER LEVEL MODIFIKASI (Threshold {best_result['Threshold']})")
    print(f"{'='*80}")
    print(f"{'Level':<12} | {'Total':<7} | {'Terdeteksi':<12} | {'Lolos':<7} | {'Recall':<8}")
    print("-" * 55)
    
    for level in ['ringan', 'sedang', 'berat', '-']:
        level_indices = [i for i, lv in enumerate(test_levels) if lv == level]
        if not level_indices:
            continue
            
        total = len(level_indices)
        if level == '-':  # Bersih
            # Untuk bersih, hitung berapa yang benar diprediksi bersih (True Negative)
            correct = sum(1 for i in level_indices if len(best_batch[i]) == 0)
            label = "Bersih"
            print(f"{label:<12} | {total:<7} | {total - correct:<12} | {correct:<7} | {correct/total:.2%}")
        else:
            # Untuk plagiat, hitung berapa yang terdeteksi (True Positive)
            detected = sum(1 for i in level_indices if len(best_batch[i]) > 0)
            label = f"Plagiat ({level})"
            print(f"{label:<12} | {total:<7} | {detected:<12} | {total - detected:<7} | {detected/total:.2%}")
    
    print(f"\nKeterangan:")
    print(f"  - Plagiat ringan : modifikasi sinonim minimal (skor diharapkan tinggi)")
    print(f"  - Plagiat sedang : parafrase + tukar klausa (skor menengah)")
    print(f"  - Plagiat berat  : restrukturisasi signifikan (skor rendah)")
    print(f"  - Bersih         : kalimat asli yang berbeda dari corpus")
    
    print(f"\n✅ File model tersimpan di: {checker.data_dir}")
    print(f"   - {os.path.basename(checker.vectorizer_path)}")
    print(f"   - {os.path.basename(checker.matrix_path)}")

if __name__ == "__main__":
    run_evaluation()
