import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Import routes dan services
from app.routes.plagiarism import router as plagiarism_router
from app.routes.spelling import router as spelling_router
from app.routes.dictionary import router as dictionary_router
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.database.session import engine, Base, SessionLocal
from app.service.spellcheck_service import spell_checker
from app.utils.limiter import limiter


# Import semua model agar metadata.create_all() tahu semua tabel
import app.models  # noqa: F401

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DICTIONARY_PATH = os.path.join(CURRENT_DIR, "data", "dataset.csv")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ─── KODE STARTUP BERJALAN DI SINI ───
    print("🚀 Menyalakan server...")
    
    # 1. auto-create tables unconditionally to prevent missing new db structures.
    print("Mengecek dan membuat tabel database...")
    Base.metadata.create_all(bind=engine)

    # 1. Load Kamus Algoritma Ejaan dari db (jika ada aktif)
    print("Memuat model NLP dan memori algoritma ejaan...")
    
    # Import model di dalam function untuk mencegah circular import exception saat init (jika terjadi)
    from app.models.dictionary import Dictionary
    
    db = SessionLocal()
    try:
        active_dict = db.query(Dictionary).filter(Dictionary.is_active == True).first()
        if active_dict and os.path.exists(active_dict.file_path):
            active_dict_path = active_dict.file_path
            print(f"Menggunakan kamus aktif dari database: {active_dict.name}")
        else:
            active_dict_path = DICTIONARY_PATH
            print(f"Menggunakan kamus default: {DICTIONARY_PATH}")
            
        spell_checker.load_dictionary(active_dict_path)
    except Exception as e:
        print(f"Gagal mengecek kamus di database: {e}")
        spell_checker.load_dictionary(DICTIONARY_PATH)
    finally:
        db.close()

    yield  # ─── MENGIZINKAN FASTAPI MULAI MENERIMA REQUEST ───
    
    print("Mematikan server. Membersihkan memori...")

app = FastAPI(lifespan=lifespan)

# CORS middleware — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
# Beritahu FastAPI bagaimana cara merespon jika limit tercapai (Akan mengembalikan HTTP 429)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Registrasi Router
app.include_router(auth_router)
app.include_router(plagiarism_router)
app.include_router(spelling_router)
app.include_router(dictionary_router)
app.include_router(admin_router)

@app.get("/")
def home():
    return {"message": "Server running"}