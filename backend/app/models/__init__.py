from app.models.user import User, UserRole
from app.models.document import Document, DocType, DocStatus
from app.models.sentence import Sentence
from app.models.checkjob import CheckJob, JobStatus
from app.models.sentencecomparison import SentenceComparison
from app.models.report import PlagiarismReport, ReportDetail, Verdict
from app.models.dictionary import Dictionary

__all__ = [
    "User", "UserRole",
    "Document", "DocType", "DocStatus",
    "Sentence",
    "CheckJob", "JobStatus",
    "SentenceComparison",
    "PlagiarismReport", "ReportDetail", "Verdict",
    "Dictionary",
]