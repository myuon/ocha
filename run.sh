#!/bin/sh
set -e

# Restore database from GCS if replica exists
litestream restore -if-replica-exists -config /etc/litestream.yml /app/conversations.db

# Run database migrations
cd /app && npx drizzle-kit push

# Start litestream in the background and the main application
exec litestream replicate -config /etc/litestream.yml -exec "node /app/apps/api/dist/index.js"