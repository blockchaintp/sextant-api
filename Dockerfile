ARG K8S_VERSION=1.20.4
FROM alpine/k8s:${K8S_VERSION} as k8s-stage

FROM ubuntu:20.04 as base
ARG NODEJS_MAJOR_VERSION=16
ARG KUBETPL_VERSION=0.9.0
ARG GRPCURL_VERSION=1.8.5

RUN apt-get update -yq \
    && apt-get install --yes ca-certificates \
      bash \
      build-essential \
      curl \
      gnupg \
      make \
      mime-support \
      openssl \
      openssh-client \
      python2-minimal \
    && curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash - \
    && update-ca-certificates \
    && apt-get update -yq \
    && apt-get upgrade -yq \
    && apt-get install --yes nodejs \
    && apt-get autoremove -yq \
    && apt-get clean -yq

RUN curl -sSL https://github.com/shyiko/kubetpl/releases/download/${KUBETPL_VERSION}/kubetpl-${KUBETPL_VERSION}-linux-amd64 -o /usr/local/bin/kubetpl \
  && chmod +x /usr/local/bin/kubetpl

COPY --from=k8s-stage --chown=root:bin /usr/bin/kubectl /usr/local/bin
COPY --from=k8s-stage --chown=root:bin /usr/bin/helm /usr/local/bin

# this is waiting for the upstream PR to be merged from
# https://github.com/blockchaintp/grpcurl -> https://github.com/fullstorydev/grpcurl
RUN mkdir -p /app/api/tmp \
  && curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v${GRPCURL_VERSION}/grpcurl_${GRPCURL_VERSION}_linux_x86_64.tar.gz -o /app/api/tmp/grpcurl.tar.gz \
  && cd /app/api/tmp \
  && tar zxvf grpcurl.tar.gz \
  && cp grpcurl /usr/local/bin \
  && rm -rf /app/api/tmp \
  && chmod +x /usr/local/bin/grpcurl

WORKDIR /app/api

# Since this is now a TS project we need to build and copy to a final app image
FROM base as build

COPY ./src /app/api/src
COPY ./config /app/api/config
COPY ./migrations /app/api/migrations
COPY ./scripts /app/api/scripts
COPY ./test /app/api/test
COPY ./knexfile.js /app/api/knexfile.js
COPY ./package.json /app/api/package.json
COPY ./tsconfig.json /app/api/tsconfig.json
COPY ./package-lock.json /app/api/package-lock.json

# Straight npm ci since we need devDependencies at this stage
RUN npm ci \
  && npm run build \
  && npm cache clean --force

FROM base as app
COPY --from=build /app/api/dist/ /app/api
COPY --from=build /app/api/config /app/api/config
COPY --from=build /app/api/test/fixtures/helmCharts.tar.gz /app/api/test/fixtures/
COPY --from=build /app/api/scripts/entrypoint /app/api/
COPY --from=build /app/api/package.json /app/api/package.json
COPY --from=build /app/api/package-lock.json /app/api/package-lock.json

ARG NPM_CI_ARGS=""
# npm ci with args since maybe production build
RUN npm ci ${NPM_CI_ARGS} \
  && npm cache clean --force

RUN chmod 755 /app/api/entrypoint
# this is the default noop metering module
# copy in the edition module
ARG EDITION_MODULE=dev
ENV EDITION_MODULE ${EDITION_MODULE}

ARG NODE_ENV=development
ENV NODE_ENV ${NODE_ENV}
ENTRYPOINT ["/app/api/entrypoint"]
