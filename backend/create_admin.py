import sys
import os

# Menambahkan root direktori proyek ke PYTHONPATH agar bisa mengimpor module backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.service.auth_service import hash_password

def create_admin(username, email, password):
    db = SessionLocal()
    try:
        # Cek apakah email sudah ada
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User dengan email {email} sudah ada!")
            # Update rolenya jadi admin
            existing_user.role = UserRole.admin
            existing_user.password = hash_password(password)
            db.commit()
            print(f"Role untuk {email} diupdate menjadi ADMIN.")
            return

        # Buat admin baru
        admin = User(
            username=username,
            email=email,
            password=hash_password(password),
            role=UserRole.admin,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✅ Admin berhasil dibuat!\nEmail: {email}\nPassword: {password}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Penggunaan: python create_admin.py <username> <email> <password>")
        sys.exit(1)
        
    create_admin(sys.argv[1], sys.argv[2], sys.argv[3])
