FROM node

RUN apt-get update

#-----------------------------------------------Install MATLAB------------------------------------------------

ENV LD_LIBRARY_PATH /usr/local/MATLAB/v90/runtime/glnxa64:/usr/local/MATLAB/v90/bin/glnxa64

#-----------------------------------------Install PYTHON & SITE PACKAGES--------------------------------------
RUN apt-get install -y python3 \
    python \
    python3-pip

RUN pip3 install --upgrade pip

RUN pip3 install opencv-contrib-python

#--------------------------------------------------Install APP------------------------------------------------

RUN adduser --home /usr/src/app --system sandboxuser
RUN chown -R sandboxuser /usr/src/app
RUN chmod -R u+rwx /usr/src/app

ENV NODE_ENV production

COPY ./app/dist/* /usr/src/app/

WORKDIR /usr/src/app/

CMD node ./bundle.js
