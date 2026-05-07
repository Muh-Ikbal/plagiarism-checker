#!/bin/bash
set -e

sleep 5
echo "Running Migration..."
alembic upgrade head

echo "Starting Fast API"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload