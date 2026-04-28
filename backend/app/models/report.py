from sqlalchemy import Column, Integer, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum


class Verdict(str, enum.Enum):
    clean  = "clean"    # 0% - 10%
    low    = "low"      # 11% - 30%
    medium = "medium"   # 31% - 60%
    high   = "high"     # 61% - 100%


class PlagiarismReport(Base):
    __tablename__ = "plagiarism_reports"

    id                     = Column(Integer, primary_key=True, index=True)
    job_id                 = Column(Integer, ForeignKey("check_jobs.id", ondelete="CASCADE"), nullable=False, unique=True)
    overall_similarity_pct = Column(Float, nullable=False)       # Persentase kemiripan keseluruhan
    flagged_sentence_count = Column(Integer, default=0)          # Jumlah kalimat yang terdeteksi mirip
    total_sentence_count   = Column(Integer, default=0)          # Total kalimat dokumen submission
    unique_source_count    = Column(Integer, default=0)          # Dari berapa dokumen referensi yang mirip
    verdict                = Column(Enum(Verdict), default=Verdict.clean)
    generated_at           = Column(DateTime, default=func.now())

    # Relasi
    job     = relationship("CheckJob", back_populates="report")
    details = relationship("ReportDetail", back_populates="report", cascade="all, delete-orphan")


class ReportDetail(Base):
    __tablename__ = "report_details"

    id               = Column(Integer, primary_key=True, index=True)
    report_id        = Column(Integer, ForeignKey("plagiarism_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    target_doc_id    = Column(Integer, ForeignKey("documents.id"), nullable=False)
    matched_sentences = Column(Integer, default=0)   # Jumlah kalimat yang cocok dengan dokumen ini
    similarity_pct   = Column(Float, nullable=False) # Kontribusi % kemiripan dari dokumen ini

    # Relasi
    report     = relationship("PlagiarismReport", back_populates="details")
    target_doc = relationship("Document")