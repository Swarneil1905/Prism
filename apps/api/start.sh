#!/bin/sh
set -e

# Railway injects PORT at runtime (often 8080). Only default for local Docker.
case "${PORT}" in
  ""|AUTO|auto) PORT=8000 ;;
esac
echo "[start] listening on port ${PORT} (Railway public target port must match this)"

# Boot API immediately so Railway healthchecks and routing work
echo "[start] starting api server..."
uvicorn main:app --host 0.0.0.0 --port "${PORT}" --proxy-headers &
UVICORN_PID=$!

cleanup() {
  kill "$UVICORN_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[start] running database migrations..."
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

echo "[start] seeding demo data..."
python -c "from data.seed_demo import seed_sqlite; seed_sqlite()"
python data/seed_demo.py &

echo "[start] api ready"
wait "$UVICORN_PID"
