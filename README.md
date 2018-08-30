# sextant-api

Api server for the [sextant](https://github.com/catenasys/sextant) frontend app.

It manages Kubernetes clusters and the installation of sawtooth onto them.

## storage

To manage state - we have abstracted a `store` interface that can be backed by your choice of persistent storage.

To begin - we are using a `file` implementation that keeps details about each cluster as files within a folder per cluster.

You can implement an alternative implementation (such as Postgres) and switch which implementation is used inside [app.js](src/app.js)
