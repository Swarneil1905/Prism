#!/bin/sh
set -e

PORT="${PORT:-8000}"
echo "[start] listening on port ${PORT}"

echo "[start] waiting for database..."
attempt=0
until alembic upgrade head; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 20 ]; then
    echo "[start] database migrations failed after ${attempt} attempts"
    exit 1
  fi
  echo "[start] migration attempt ${attempt} failed, retrying in 3s..."
  sleep 3
done

echo "[start] seeding demo data in background..."
python data/seed_demo.py &

echo "[start] starting api server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT}"
