ARG K8S_VERSION=1.20.4
FROM alpine/k8s:${K8S_VERSION} as k8s-stage

FROM ubuntu:20.04 as base
ARG NODEJS_MAJOR_VERSION=16
ARG KUBETPL_VERSION=0.9.0
ARG GRPCURL_VERSION=1.8.5

RUN apt-get update -yq && \
    apt-get install --yes ca-certificates make build-essential curl openssl openssh-client bash python2-minimal mime-support gnupg && \
    curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash -  && \
    update-ca-certificates && \
    apt-get update -yq && apt-get upgrade -yq && \
    apt-get install --yes nodejs && \
    apt-get autoremove -yq && apt-get clean -yq

RUN curl -sSL https://github.com/shyiko/kubetpl/releases/download/${KUBETPL_VERSION}/kubetpl-${KUBETPL_VERSION}-linux-amd64 -o /usr/local/bin/kubetpl && \
    chmod +x /usr/local/bin/kubetpl

COPY --from=k8s-stage --chown=root:bin /usr/bin/kubectl /usr/local/bin
COPY --from=k8s-stage --chown=root:bin /usr/bin/helm /usr/local/bin

# this is waiting for the upstream PR to be merged from
# https://github.com/blockchaintp/grpcurl -> https://github.com/fullstorydev/grpcurl
RUN mkdir -p /app/api/tmp && \
  curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v${GRPCURL_VERSION}/grpcurl_${GRPCURL_VERSION}_linux_x86_64.tar.gz -o /app/api/tmp/grpcurl.tar.gz && \
    cd /app/api/tmp && \
    tar zxvf grpcurl.tar.gz && \
    cp grpcurl /usr/local/bin && \
    rm -rf /app/api/tmp && \
    chmod +x /usr/local/bin/grpcurl

# install api server
FROM base AS compile
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./package-lock.json /app/api/package-lock.json
RUN npm ci
COPY . /app/api
RUN npm run compile

FROM base AS javascript
WORKDIR /app/api
COPY --from=compile /app/api/dist/editions /app/api/editions
COPY --from=compile /app/api/dist/src /app/api/src
COPY --from=compile /app/api/dist/scripts /app/api/scripts
COPY ./package.json /app/api/package.json
COPY ./package-lock.json /app/api/package-lock.json
COPY ./knexfile.js /app/api/knexfile.js
COPY ./config /app/api/config
COPY ./test /app/api/test
COPY ./migrations /app/api/migrations

RUN npm ci ${NPM_CI_ARGS} && npm cache clean --force

# this is the default noop metering module
# copy in the edition module
ARG EDITION_MODULE=dev
COPY --from=compile /app/api/dist/editions/${EDITION_MODULE}.js /app/api/src/edition.js

ARG NODE_ENV=development
ENV NODE_ENV ${NODE_ENV}
ENTRYPOINT ["npm"]
CMD ["run", "serve"]
