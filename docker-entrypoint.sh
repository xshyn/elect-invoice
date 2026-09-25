#!/bin/sh
set -e
echo "Applying database migrations..."
npx prisma migrate deploy
echo "Seeding default business profile (idempotent)..."
npx prisma db seed || echo "Seed skipped/failed — the app will fall back to built-in defaults."
echo "Starting Next.js..."
exec node server.js
