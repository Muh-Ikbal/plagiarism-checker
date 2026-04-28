"""
SymSpell-based Indonesian Spell Checker Controller.

Uses symspellpy for fast approximate string matching
with a custom Indonesian frequency dictionary.
"""

import os
import re
from symspellpy import SymSpell, Verbosity

# ─── Singleton SymSpell instance ─────────────────────────────────
_sym_spell = None


def get_symspell() -> SymSpell:
    """Get or initialize the SymSpell instance (singleton)."""
    global _sym_spell
    if _sym_spell is not None:
        return _sym_spell

    _sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

    # Load Indonesian frequency dictionary
    dict_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "dictionaries",
        "id_frequency_dict.txt",
    )

    if not os.path.exists(dict_path):
        raise FileNotFoundError(f"Dictionary not found: {dict_path}")

    _sym_spell.load_dictionary(
        dict_path,
        term_index=0,
        count_index=1,
        separator=" ",
    )

    print(f"[SpellChecker] Dictionary loaded: {_sym_spell.word_count} words")
    return _sym_spell


def check_text(text: str, max_edit_distance: int = 2) -> dict:
    """
    Check spelling of the given text.

    Returns a dict with:
    - total_words: total words checked
    - error_count: number of misspelled words
    - errors: list of { word, position, suggestions }
    """
    sym = get_symspell()

    if not text or not text.strip():
        return {"total_words": 0, "error_count": 0, "errors": []}

    # Tokenize: split by whitespace and punctuation, keeping track of positions
    errors = []
    seen_words = {}  # track already-checked words to avoid duplicates
    position = 0

    # Split text into tokens preserving positions
    tokens = re.finditer(r"[a-zA-Z]+", text)

    word_count = 0

    for match in tokens:
        word = match.group()
        start_pos = match.start()
        lower_word = word.lower()

        # Skip very short words (1 character)
        if len(lower_word) <= 1:
            word_count += 1
            continue

        word_count += 1

        # Lookup in SymSpell
        suggestions = sym.lookup(
            lower_word,
            Verbosity.CLOSEST,
            max_edit_distance=max_edit_distance,
        )

        # If the word is found exactly (distance 0), it's correct
        if suggestions and suggestions[0].distance == 0:
            continue

        # Word not found or has edit distance > 0 → potential error
        suggestion_list = []
        for s in suggestions[:5]:  # max 5 suggestions
            suggestion_list.append({
                "word": s.term,
                "distance": s.distance,
                "frequency": s.count,
            })

        # Only report if we haven't already reported this word
        if lower_word not in seen_words:
            errors.append({
                "word": word,
                "position": start_pos,
                "suggestions": suggestion_list,
            })
            seen_words[lower_word] = True
        else:
            # Still report duplicate occurrences with their position
            errors.append({
                "word": word,
                "position": start_pos,
                "suggestions": suggestion_list,
            })

    return {
        "total_words": word_count,
        "error_count": len(errors),
        "errors": errors,
    }
