#!/bin/bash
SCRIPT=$(readlink -f "$0")
PWD=$(dirname "$SCRIPT")

echo "Creating matlab volume..."
docker volume create --name matlab

echo "Creating ptyhon-site-packages volume..."
docker volume create --name python-site-packages

echo "Starting containers..."
docker-compose -f "$PWD"/docker-compose.prod.yml up
