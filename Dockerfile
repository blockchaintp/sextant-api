FROM mhart/alpine-node:8
MAINTAINER kaiyadavenport@gmail.com
RUN apk update
RUN apk upgrade
RUN apk add bash
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./yarn.lock /app/api/yarn.lock
RUN yarn install
COPY . /app/api
ENTRYPOINT ["bash", "run.sh"]