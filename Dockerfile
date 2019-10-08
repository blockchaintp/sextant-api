FROM ubuntu:bionic
MAINTAINER kai@blockchaintp.com
ENV NODEJS_MAJOR_VERSION=10
ENV KUBETPL_VERSION=0.7.1
ENV HELM_VERSION=v3.0.0-beta.3

RUN apt-get update -y && \
    apt-get install --yes ca-certificates make build-essential curl openssl openssh-client bash python-minimal mime-support gnupg && \
    curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash -  && \
    update-ca-certificates && \
    apt-get update -y && apt-get upgrade -y  && \
    apt-get install --yes nodejs && \
    apt-get autoremove -y && apt-get clean -y

RUN curl -L -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl  && \
    chmod +x /usr/local/bin/kubectl

RUN curl -sSL https://github.com/shyiko/kubetpl/releases/download/0.7.1/kubetpl-${KUBETPL_VERSION}-linux-amd64 -o /usr/local/bin/kubetpl && \
    chmod +x /usr/local/bin/kubetpl

RUN mkdir -p /app/api/tmp && \
    curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz -o /app/api/tmp/helm.tar.gz && \
    cd /app/api/tmp && \
    tar zxvf helm.tar.gz && \
    cp linux-amd64/helm /usr/local/bin && \
    rm -rf /app/api/tmp && \
    chmod +x /usr/local/bin/helm

# install api server
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./package-lock.json /app/api/package-lock.json
RUN npm install
COPY . /app/api

# this is the default noop metering module
# override this with --build-arg METERING_MODULE=./src/metering/ecs.js
ARG METERING_MODULE=dev.js

# overwrite the imported metering module with the one we want to use for this image
COPY ./src/metering/${METERING_MODULE} /app/api/src/metering/index.js

COPY ./src/deployment_templates/${METERING_MODULE} /app/api/src/deployment_templates/index.js

ENTRYPOINT ["npm"]
CMD ["run", "serve"]
