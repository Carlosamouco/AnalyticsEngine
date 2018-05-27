FROM node

RUN apt-get update
RUN apt-get install -y wget
RUN wget -O /bin/docker https://master.dockerproject.org/linux/x86_64/docker
RUN chmod 7 /bin/docker

RUN mkdir -p /usr/src/app
COPY ./package.json ./package-lock.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install

EXPOSE 3000

CMD docker build -t docker-sandbox sandbox/ && npm run watch
