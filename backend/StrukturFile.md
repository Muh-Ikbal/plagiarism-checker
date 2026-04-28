plagiarism-checker/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # Entry point FastAPI
│   ├── config.py                # Env vars, settings
│   │
│   ├── api/                     # Layer HTTP (routing)
│   │   ├── __init__.py
│   │   ├── deps.py              # Dependency injection (db session, current user)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py          # POST /login, /register
│   │       ├── documents.py     # CRUD dokumen
│   │       ├── jobs.py          # Trigger & status cek plagiarisme
│   │       └── reports.py       # Ambil hasil laporan
│   │
│   ├── core/                    # Business logic murni (tidak ada HTTP di sini)
│   │   ├── __init__.py
│   │   ├── preprocessing.py     # Cleaning, tokenisasi kalimat
│   │   ├── tfidf.py             # Bangun & update TF-IDF matrix
│   │   ├── similarity.py        # Cosine similarity antar kalimat
│   │   └── report_builder.py   # Agregasi hasil → laporan
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── document.py
│   │   ├── sentence.py
│   │   ├── vocabulary.py
│   │   ├── check_job.py
│   │   └── report.py
│   │
│   ├── schemas/                 # Pydantic schemas (request & response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── document.py
│   │   ├── job.py
│   │   └── report.py
│   │
│   ├── services/                # Orchestrator — koordinasi core + db
│   │   ├── __init__.py
│   │   ├── document_service.py  # Upload, ekstrak teks, indexing
│   │   ├── job_service.py       # Buat job, cek status
│   │   └── report_service.py    # Generate & ambil report
│   │
│   ├── tasks/                   # Celery background tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Inisialisasi Celery
│   │   ├── index_document.py    # Task: preprocessing + vectorize dokumen baru
│   │   └── run_check.py         # Task: jalankan pengecekan plagiarisme
│   │
│   └── db/
│       ├── __init__.py
│       ├── session.py           # PostgreSQL session factory
│       └── migrations/          # Alembic migrations
│
├── tests/
│   ├── test_preprocessing.py
│   ├── test_tfidf.py
│   └── test_similarity.py
│
├── .env
├── requirements.txt
├── docker-compose.yml
└── Dockerfile