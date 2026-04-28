import os
from celery import Celery
from app.config import settings

# Inisialisasi Celery app
celery_app = Celery(
    "wordlens_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    # include=["app.tasks.index_document", "app.tasks.run_check"]
)

# Konfigurasi opsional Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
