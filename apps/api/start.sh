#!/bin/sh
set -e
echo "Running migrations..."
alembic upgrade head
echo "Seeding demo data..."
python data/seed_demo.py
echo "Starting server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
