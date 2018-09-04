FROM mhart/alpine-node:8
MAINTAINER kai@blockchaintp.com

# install aws cli
RUN apk -v --update add \
    ca-certificates \
    openssl \
    openssh-keygen \
    bash \
    curl \
    python \
    py-pip \
    groff \
    less \
    mailcap \
    && \
  update-ca-certificates && \
  pip install --upgrade awscli==1.14.5 s3cmd==2.0.1 python-magic && \
  apk -v --purge del py-pip && \
  rm /var/cache/apk/*

# install kops
RUN curl -L -o kops https://github.com/kubernetes/kops/releases/download/$(curl -s https://api.github.com/repos/kubernetes/kops/releases/latest | grep tag_name | cut -d '"' -f 4)/kops-linux-amd64 \
  && \
  chmod +x ./kops && \
  mv ./kops /usr/local/bin/

# install kubectl
RUN curl -L -o kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl \
  && \
  chmod +x ./kubectl && \
  mv ./kubectl /usr/local/bin/kubectl

# install api server
WORKDIR /app/api
COPY ./package.json /app/api/package.json
COPY ./yarn.lock /app/api/yarn.lock
RUN yarn install
COPY . /app/api
ENTRYPOINT ["bash", "run.sh"]

