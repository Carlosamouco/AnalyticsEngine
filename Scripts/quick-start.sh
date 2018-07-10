#!/bin/bash
export COMPOSE_CONVERT_WINDOWS_PATHS=1

echo "Removing running docker-sandbox containers..."
docker rm -f $(docker ps -a -q --filter ancestor=docker-sandbox)

echo "Starting containers..."
docker-compose up
