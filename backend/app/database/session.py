import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings


# SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Fungsi untuk mendapatkan sesi database di setiap request API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()