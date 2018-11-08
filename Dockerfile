FROM ubuntu:bionic
MAINTAINER kai@blockchaintp.com
ENV NODEJS_MAJOR_VERSION=8 
ENV AWS_CLI_VERSION=1.14.5 S3_CMD_VERSION=2.0.1
ENV KUBETPL_VERSION=0.7.1

# this is the default noop metering module
# override this with --build-arg METERING_MODULE=./src/metering/ecs.js
ARG METERING_MODULE=./src/metering/dev
# install aws cli

#RUN apt-get install apt-utils -y

RUN apt-get update -y && \
       apt-get install --yes ca-certificates curl openssl openssh-client bash python-minimal mime-support gnupg && \
       curl --silent --location https://deb.nodesource.com/setup_${NODEJS_MAJOR_VERSION}.x | bash -  && \
       curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -  && \
       echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list  && \
       update-ca-certificates && \
       apt-get update -y && apt-get upgrade -y  && \
       apt-get install -y python-pip  && \
       pip install --upgrade awscli==${AWS_CLI_VERSION} s3cmd==${S3_CMD_VERSION} python-magic && \
       apt-get install --yes nodejs yarn && \
       curl -L -o /usr/local/bin/kops https://github.com/kubernetes/kops/releases/download/$(curl -s https://api.github.com/repos/kubernetes/kops/releases/latest | grep tag_name | cut -d "\"" -f 4)/kops-linux-amd64 && \
       chmod +x /usr/local/bin/kops  && \
       curl -L -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl  && \
       chmod +x /usr/local/bin/kubectl && \
       curl -sSL https://github.com/shyiko/kubetpl/releases/download/0.7.1/kubetpl-${KUBETPL_VERSION}-linux-amd64 -o /usr/local/bin/kubetpl && \
       chmod +x /usr/local/bin/kubetpl &&  \
       apt-get autoremove -y && apt-get clean -y

# install api server
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./yarn.lock /app/api/yarn.lock
RUN yarn install
COPY . /app/api

# overwrite the imported metering module with the one we want to use for this image
COPY ${METERING_MODULE} /app/api/src/metering/index.js

ENTRYPOINT ["bash", "run.sh"]

