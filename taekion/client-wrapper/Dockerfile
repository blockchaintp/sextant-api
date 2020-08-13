FROM golang:1.13.8
WORKDIR /go/src/github.com/catenasys/sextant-api/taekion/client-wrapper
COPY main.go .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o client-wrapper .

FROM taekion/taekion-fs-client:latest
COPY --from=0 /go/src/github.com/catenasys/sextant-api/taekion/client-wrapper/client-wrapper /usr/local/bin
USER root
RUN mv /usr/local/bin/tfs-cli /usr/local/bin/tfs-cli-actual
RUN mv /usr/local/bin/tfs-fuse /usr/local/bin/tfs-fuse-actual
COPY ./tfs-cli.sh /usr/local/bin/tfs-cli
COPY ./tfs-fuse.sh /usr/local/bin/tfs-fuse
RUN chmod a+x /usr/local/bin/tfs-cli
RUN chmod a+x /usr/local/bin/tfs-fuse
# USER user (add if not running on mac)
ENTRYPOINT [ "bash" ]
