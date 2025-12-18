#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

until nc -z -v -w30 $DB_HOST ${DB_PORT:-5432} 2>/dev/null; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "PostgreSQL is ready!"

echo "Running database migrations..."


if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected. Using dist/..."

  npx typeorm migration:run -d dist/data-source.js
else
  echo "Development environment detected. Using src/..."

  npm run migration:run
fi

echo "Migrations completed!"

echo "Starting the application..."
exec "$@"