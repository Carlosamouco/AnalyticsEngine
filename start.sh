#!/bin/bash
SCRIPT=$(readlink -f "$0")
PWD=$(dirname "$SCRIPT")
echo "Creating matlab volume..."
docker volume create --name matlab
docker-compose -f "$PWD"/docker-compose.prod.yml up
