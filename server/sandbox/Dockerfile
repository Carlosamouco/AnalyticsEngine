FROM node:slim

RUN adduser --home /usr/src/app --system sandboxuser
RUN chown -R sandboxuser /usr/src/app
RUN chmod -R u+rwx /usr/src/app

RUN apt-get update
RUN apt-get install -y python3 \
    python \
    unzip

RUN mkdir /mcr-install && \    
    cd /mcr-install && \
    wget http://ssd.mathworks.com/supportfiles/downloads/R2015b/deployment_files/R2015b/installers/glnxa64/MCR_R2015b_glnxa64_installer.zip && \  
    mkdir /usr/local/MATLAB && \
    cd /mcr-install && \
    unzip -q MCR_R2015b_glnxa64_installer.zip && \
    ./install -destinationFolder /usr/local/MATLAB -agreeToLicense yes -mode silent && \
    cd / && \
    rm -rf mcr-install

ENV LD_LIBRARY_PATH /usr/local/MATLAB/v90/runtime/glnxa64:/usr/local/MATLAB/v90/bin/glnxa6
ENV NODE_ENV production

COPY ./app/dist/* /usr/src/app/

WORKDIR /usr/src/app/

CMD node ./bundle.js
