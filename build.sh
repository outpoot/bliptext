#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull

echo "Building Docker images..."
docker compose build --no-cache

echo "Stopping existing containers..."
docker compose down --volumes --remove-orphans

echo "Starting containers..."
docker compose up -d

echo "Checking container status..."
sleep 5
docker compose ps

echo "Tailing logs (press Ctrl+C to stop)..."
docker compose logs -f