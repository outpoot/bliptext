git pull
docker build -t bliptext .
docker-compose down --volumes --remove-orphans
docker-compose up -d