FROM ubuntu:bionic
MAINTAINER kai@blockchaintp.com
ARG NODEJS_MAJOR_VERSION=10
ARG KUBETPL_VERSION=0.9.0
ARG HELM_VERSION=v3.1.2
ARG GRPCURL_VERSION=1.8.0

RUN apt-get update -y && \
    apt-get install --yes ca-certificates make build-essential curl openssl openssh-client bash python-minimal mime-support gnupg && \
    curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash -  && \
    update-ca-certificates && \
    apt-get update -y && apt-get upgrade -y  && \
    apt-get install --yes nodejs && \
    apt-get autoremove -y && apt-get clean -y

RUN curl -L -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl  && \
    chmod +x /usr/local/bin/kubectl

RUN curl -sSL https://github.com/shyiko/kubetpl/releases/download/${KUBETPL_VERSION}/kubetpl-${KUBETPL_VERSION}-linux-amd64 -o /usr/local/bin/kubetpl && \
    chmod +x /usr/local/bin/kubetpl

RUN mkdir -p /app/api/tmp && \
    curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz -o /app/api/tmp/helm.tar.gz && \
    cd /app/api/tmp && \
    tar zxvf helm.tar.gz && \
    cp linux-amd64/helm /usr/local/bin && \
    rm -rf /app/api/tmp && \
    chmod +x /usr/local/bin/helm

RUN mkdir -p /app/api/tmp && \
  curl -sSL https://github.com/fullstorydev/grpcurl/releases/download/v${GRPCURL_VERSION}/grpcurl_${GRPCURL_VERSION}_linux_x86_64.tar.gz -o /app/api/tmp/grpcurl.tar.gz && \
    cd /app/api/tmp && \
    tar zxvf grpcurl.tar.gz && \
    cp grpcurl /usr/local/bin && \
    rm -rf /app/api/tmp && \
    chmod +x /usr/local/bin/grpcurl

# install api server
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./package-lock.json /app/api/package-lock.json
RUN npm install
COPY . /app/api

# this is the default noop metering module
# copy in the edition module
ARG EDITION_MODULE=dev.js
COPY ./editions/${EDITION_MODULE} /app/api/src/edition.js

ENTRYPOINT ["npm"]
CMD ["run", "serve"]
