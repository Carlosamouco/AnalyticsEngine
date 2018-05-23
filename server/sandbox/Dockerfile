FROM node:slim

RUN adduser --home /usr/src/app --system sandboxuser
RUN chown -R sandboxuser /usr/src/app
RUN chmod -R u+rwx /usr/src/app

RUN apt-get update
RUN apt-get install -y python3 \
    python

ENV LD_LIBRARY_PATH /usr/local/MATLAB/v90/runtime/glnxa64:/usr/local/MATLAB/v90/bin/glnxa64
ENV NODE_ENV production

COPY ./app/dist/* /usr/src/app/

WORKDIR /usr/src/app/

CMD node ./bundle.js
