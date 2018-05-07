FROM node

# RUN apt-get update && apt-get install -y unzi
# RUN apt-get install -y python
# RUN mkdir /mcr-install && \    
#     cd /mcr-install && \
#     wget http://ssd.mathworks.com/supportfiles/downloads/R2015b/deployment_files/R2015b/installers/glnxa64/MCR_R2015b_glnxa64_installer.zip && \  
#     mkdir /usr/local/MATLAB && \
#     cd /mcr-install && \
#     unzip -q MCR_R2015b_glnxa64_installer.zip && \
#     ./install -destinationFolder /usr/local/MATLAB -agreeToLicense yes -mode silent && \
#     cd / && \
#     rm -rf mcr-install
# 
# ENV LD_LIBRARY_PATH /usr/local/MATLAB/v90/runtime/glnxa64:/usr/local/MATLAB/v90/bin/glnxa6

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
