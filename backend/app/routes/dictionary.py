import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.dictionary import Dictionary
from app.service.spellcheck_service import spell_checker

router = APIRouter(prefix="/admin/dictionary", tags=["Admin Dictionary"])

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# app/data/dictionaries
DICTIONARIES_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "data", "dictionaries")

os.makedirs(DICTIONARIES_DIR, exist_ok=True)

@router.get("/active")
def get_active_dictionary(db: Session = Depends(get_db)):
    active_dict = db.query(Dictionary).filter(Dictionary.is_active == True).first()
    if not active_dict:
        return {"id": None, "name": "Belum ada kamus aktif", "file_size_mb": "0 MB", "created_at": None}
    
    return {
        "id": active_dict.id,
        "name": active_dict.name,
        "file_size_mb": active_dict.file_size_mb,
        "created_at": active_dict.created_at,
        "updated_at": active_dict.updated_at
    }

@router.post("/upload")
def upload_dictionary(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate extension
    allowed_extensions = [".csv", ".txt", ".dic"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan .csv, .txt, atau .dic")
    
    file_path = os.path.join(DICTIONARIES_DIR, file.filename)
    
    # Save the file (replaces if it already exists as requested by user)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")
    
    file_size_bytes = os.path.getsize(file_path)
    file_size_mb = f"{(file_size_bytes / (1024 * 1024)):.2f} MB"
    
    # Deactivate current active dictionaries
    db.query(Dictionary).update({"is_active": False})
    
    # Check if a dictionary with this name already exists in DB
    existing_dict = db.query(Dictionary).filter(Dictionary.name == file.filename).first()
    if existing_dict:
        existing_dict.is_active = True
        existing_dict.file_size_mb = file_size_mb
        existing_dict.file_path = file_path
        db.commit()
        db.refresh(existing_dict)
    else:
        new_dict = Dictionary(
            name=file.filename,
            file_path=file_path,
            file_size_mb=file_size_mb,
            is_active=True
        )
        db.add(new_dict)
        db.commit()
    
    # Reload dictionary in memory
    try:
        spell_checker.load_dictionary(file_path, force_reload=True)
    except Exception as e:
        # Revert active state or simply log error depending on strictness
        raise HTTPException(status_code=500, detail=f"Kamus tersimpan tapi gagal di-load ke memori: {str(e)}")
        
    return {"message": "File kamus berhasil diperbarui dan diaktifkan", "name": file.filename}
