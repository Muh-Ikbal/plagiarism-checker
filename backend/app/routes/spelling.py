import re
from fastapi import APIRouter
from app.schemas.spelling_shcema import SpellCheckRequest, SpellCheckResponse, CorrectionDetail
from app.service.spellcheck_service import spell_checker

router = APIRouter(prefix="/api/spelling", tags=["Spelling Checker"])

@router.post("/check", response_model=SpellCheckResponse)
def check_spelling(request: SpellCheckRequest):
    original_text = request.text
    tokens = re.findall(r'\b\w+\b|[^\w\s]|\s+', original_text)
    
    corrected_tokens = []
    corrections_made = []

    for token in tokens:
        if token.isalpha():
            suggestions = spell_checker.get_suggestions(token.lower(), top_n=5)
            
            if suggestions:
                # Untuk teks utama, ambil rekomendasi terbaik (peringkat 1)
                best_match = suggestions[0]
                
                # Jaga kapitalisasi
                if token.istitle(): best_match = best_match.capitalize()
                elif token.isupper(): best_match = best_match.upper()

                corrected_tokens.append(best_match)
                
                # Masukkan semua 5 saran ke list koreksi
                corrections_made.append(
                    CorrectionDetail(original=token, suggestions=suggestions)
                )
            else:
                corrected_tokens.append(token)
        else:
            corrected_tokens.append(token)
            
    return SpellCheckResponse(
        original_text=original_text,
        corrected_text="".join(corrected_tokens),
        corrections=corrections_made
    )