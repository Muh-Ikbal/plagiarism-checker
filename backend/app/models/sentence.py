from sqlalchemy import Column, Integer, SmallInteger, Text, Boolean, ForeignKey,JSON
from sqlalchemy.orm import relationship
from app.database.session import Base


class Sentence(Base):
    __tablename__ = "sentences"

    id              = Column(Integer, primary_key=True, index=True)
    document_id     = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    sentence_index  = Column(SmallInteger, nullable=False)   # Urutan ke-n dalam dokumen
    page_number     = Column(SmallInteger, nullable=True)
    bounding_boxes  = Column(JSON, nullable=True)
    raw_text        = Column(Text, nullable=False)           # Kalimat asli
    normalized_text = Column(Text)                           # Setelah stopword removal & stemming
    token_count     = Column(SmallInteger, default=0)        # Jumlah kata
    char_count      = Column(SmallInteger, default=0)
    is_valid        = Column(Boolean, default=True, index=True)  # FALSE jika kalimat terlalu pendek

    # Relasi
    document        = relationship("Document", back_populates="sentences")