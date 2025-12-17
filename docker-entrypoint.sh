#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until nc -z -v -w30 $DB_HOST 5432 2>/dev/null; do
  echo "aiting for database connection..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "Running database migrations..."
npm run migration:run

echo "✅ Migrations completed!"

echo "Starting the application..."
exec "$@"
