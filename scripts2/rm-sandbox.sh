echo "Removing running docker-sandbox containers..."
docker rm -f $(docker ps -a -q --filter ancestor=docker-sandbox)