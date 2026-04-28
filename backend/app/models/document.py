from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum


class DocType(str, enum.Enum):
    submission = "submission"   # Diunggah user untuk dicek
    reference  = "reference"    # Diunggah admin sebagai pembanding


class DocStatus(str, enum.Enum):
    pending    = "pending"      # Baru diupload, belum diproses
    processing = "processing"   # Sedang diindex
    indexed    = "indexed"      # Siap digunakan
    failed     = "failed"       # Gagal diproses


class Document(Base):
    __tablename__ = "documents"

    id                = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title             = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_path         = Column(String(500))           # Path file asli di storage
    raw_text          = Column(Text)                  # Teks mentah hasil ekstraksi
    cleaned_text      = Column(Text)                  # Teks setelah preprocessing
    word_count        = Column(Integer, default=0)
    sentence_count    = Column(Integer, default=0)
    language          = Column(String(10), default="id")
    doc_type          = Column(Enum(DocType), nullable=False, index=True)
    status            = Column(Enum(DocStatus), default=DocStatus.pending, index=True)
    meta_data         = Column(JSON)                  # author, tahun, dll (metadata = reserved word)
    created_at        = Column(DateTime, default=func.now())
    updated_at        = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relasi
    uploader          = relationship("User", back_populates="documents")
    sentences         = relationship("Sentence", back_populates="document", cascade="all, delete-orphan")