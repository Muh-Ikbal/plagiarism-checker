from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class SentenceComparison(Base):
    __tablename__ = "sentence_comparisons"

    id                 = Column(Integer, primary_key=True, index=True)
    job_id             = Column(Integer, ForeignKey("check_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    source_sentence_id = Column(Integer, ForeignKey("sentences.id"), nullable=False, index=True)
    target_sentence_id = Column(Integer, ForeignKey("sentences.id"), nullable=False)
    cosine_similarity  = Column(Float, nullable=False)       # Nilai 0.0 - 1.0
    is_flagged         = Column(Boolean, default=False, index=True)  # TRUE jika >= threshold

    # Relasi
    job            = relationship("CheckJob", back_populates="comparisons")
    source_sentence = relationship("Sentence", foreign_keys=[source_sentence_id])
    target_sentence = relationship("Sentence", foreign_keys=[target_sentence_id])