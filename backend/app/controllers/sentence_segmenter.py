"""
Sentence Segmenter — Memecah teks menjadi kalimat-kalimat menggunakan NLTK.

Pipeline:
  Extract Text → **Sentence Segmentation** → Preprocessing NLP

Referensi:
  Bird, Steven, Edward Loper and Ewan Klein (2009).
  Natural Language Processing with Python. O'Reilly Media Inc.
"""

import nltk
from nltk.tokenize import sent_tokenize

# Download punkt tokenizer data (sekali saja)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)


def segment_sentences(text: str) -> list[str]:
    """
    Memecah teks menjadi kalimat menggunakan NLTK sent_tokenize.

    NLTK menggunakan model Punkt yang sudah ditraining untuk
    menangani singkatan, angka desimal, dan edge case lainnya.

    Args:
        text: Teks yang akan di-segmentasi.

    Returns:
        List kalimat hasil segmentasi.
    """
    if not text or not text.strip():
        return []

    sentences = sent_tokenize(text)

    # Filter kalimat kosong dan terlalu pendek (< 3 karakter)
    sentences = [s.strip() for s in sentences if len(s.strip()) >= 3]

    return sentences
