from pydantic import BaseModel
from typing import List, Dict

# Model untuk menerima data dari React
class SpellCheckRequest(BaseModel):
    text: str

# Model untuk mengembalikan data ke React
class CorrectionDetail(BaseModel):
    original: str
    suggestions: List[str]

class SpellCheckResponse(BaseModel):
    original_text: str
    corrected_text: str
    corrections: List[CorrectionDetail]