from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(100), nullable=False, unique=True)
    email      = Column(String(150), nullable=False, unique=True)
    password   = Column(String(255), nullable=False)
    role       = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relasi
    documents  = relationship("Document", back_populates="uploader")
    check_jobs = relationship("CheckJob", back_populates="requested_by")