FROM node

RUN apt-get update -qq && apt-get install -qqy \
  apt-transport-https \
  ca-certificates \
  curl \
  lxc \
  iptables

RUN curl -sSL https://get.docker.com/ | sh

ADD ./wrapdocker /usr/local/bin/wrapdocker
RUN chmod +x /usr/local/bin/wrapdocker

RUN mkdir -p /usr/src/app

COPY ./package.json ./package-lock.json /usr/src/app/

WORKDIR /usr/src/app

RUN npm install

EXPOSE 3000

# CMD npm run watch

CMD wrapdocker && docker build -t docker-sandbox sandbox/ && npm run watch
