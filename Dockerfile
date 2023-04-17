ARG K8S_VERSION=1.20.4
FROM alpine/k8s:${K8S_VERSION} as k8s-stage

FROM ubuntu:20.04 as base
ARG NODEJS_MAJOR_VERSION=18

COPY --from=k8s-stage --chown=root:bin /usr/bin/helm /usr/local/bin
COPY --from=k8s-stage --chown=root:bin /usr/bin/kubectl /usr/local/bin

RUN apt-get update -yq \
  && apt-get upgrade -yq \
  && apt-get install --yes --no-install-recommends \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  && update-ca-certificates \
  && curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash - \
  && apt-get install --yes --no-install-recommends \
  nodejs \
  && apt-get autoremove -yq \
  && apt-get clean -yq

FROM base as build
ARG NODEJS_MAJOR_VERSION=18
ARG GRPCURL_VERSION=1.8.5

RUN apt-get update -yq && \
  apt-get install --yes --no-install-recommends \
  build-essential \
  mime-support \
  openssl \
  openssh-client \
  python2-minimal \
  && apt-get update -yq \
  && apt-get autoremove -yq \
  && apt-get clean -yq

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
FROM build AS compile
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./package-lock.json /app/api/package-lock.json
RUN npm ci
COPY . /app/api
RUN npm run compile


FROM build as final-build
WORKDIR /app/api
COPY --from=compile /app/api/package.json /app/api/package.json
COPY --from=compile /app/api/package-lock.json /app/api/package-lock.json
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS dev-build
ARG EDITION_MODULE=dev
ARG NODE_ENV=development
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - \
  && echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends \
  containerd.io \
  docker-ce \
  docker-ce-cli

WORKDIR /app/api
COPY --from=compile /app/api /app/api
COPY --from=compile /app/api/dist/editions /app/api/editions

# this is the default noop metering module
# copy in the edition module
COPY --from=compile /app/api/dist/editions/${EDITION_MODULE}.js /app/api/src/edition.js

ARG NODE_ENV=development
ENV NODE_ENV ${NODE_ENV}
ENTRYPOINT ["npm"]
CMD ["run", "serve"]


FROM base AS final
ARG EDITION_MODULE=dev
ARG NODE_ENV=development

WORKDIR /app/api
COPY --from=compile /app/api/package.json /app/api/package.json
COPY --from=compile /app/api/package-lock.json /app/api/package-lock.json
COPY --from=compile /app/api/dist/editions /app/api/editions
COPY --from=compile /app/api/dist/src /app/api/src
COPY --from=compile /app/api/config /app/api/config
COPY --from=compile /app/api/migrations /app/api/migrations
COPY --from=compile /app/api/knexfile.js /app/api/knexfile.js
COPY --from=final-build /app/api/node_modules /app/api/node_modules

# this is the default noop metering module
# copy in the edition module
COPY --from=compile /app/api/dist/editions/${EDITION_MODULE}.js /app/api/src/edition.js

ENV NODE_ENV ${NODE_ENV}
ENTRYPOINT ["npm"]
CMD ["run", "serve"]
