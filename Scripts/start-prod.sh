#!/bin/bash
export COMPOSE_CONVERT_WINDOWS_PATHS=1

echo "Creating matlab volume..."
docker volume create --name matlab

echo "Building docker-sandbox container..."
docker build -t docker-sandbox ../server/sandbox/

echo "Removing running docker-sandbox containers..."
docker rm -f $(docker ps -a -q --filter ancestor=docker-sandbox)

echo "Starting containers..."
docker-compose up -f ../docker-compose.prod.yml
