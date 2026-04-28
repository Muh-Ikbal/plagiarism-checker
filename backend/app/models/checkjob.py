from sqlalchemy import Column, Integer, Float, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum


class JobStatus(str, enum.Enum):
    queued  = "queued"
    running = "running"
    done    = "done"
    failed  = "failed"


class CheckJob(Base):
    __tablename__ = "check_jobs"

    id                   = Column(Integer, primary_key=True, index=True)
    source_doc_id        = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=True)
    status               = Column(Enum(JobStatus), default=JobStatus.queued, index=True)
    similarity_threshold = Column(Float, default=0.5)   # Batas minimum dianggap mirip (0.0 - 1.0)
    started_at           = Column(DateTime, nullable=True)
    finished_at          = Column(DateTime, nullable=True)
    error_message        = Column(Text, nullable=True)
    created_at           = Column(DateTime, default=func.now())

    # Relasi
    requested_by = relationship("User", back_populates="check_jobs")
    source_doc   = relationship("Document")
    report       = relationship("PlagiarismReport", back_populates="job", uselist=False)
    comparisons  = relationship("SentenceComparison", back_populates="job", cascade="all, delete-orphan")