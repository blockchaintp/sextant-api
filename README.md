# sextant-api

Api server for the [sextant](https://github.com/catenasys/sextant) frontend app.

It manages Kubernetes clusters and the installation of sawtooth onto them.

## storage

To manage state - we have abstracted a `store` interface that can be backed by
your choice of persistent storage.

## notes

### manifests

### Deploying a TFS instance

The taekion-tp and taekion-rest-api images live on Docker Hub. In order to
pull down these images and create a TFS deployment you will need to be
added to the btpTeam group on Taekion's dockerHub.

Prior to creating a TFS deployment you will need to create a namespace for
the deployment. In that namespace you will need to create a secret
that holds your dockerHub credentials.

```bash
kubectl create namespace <namespace>
```

```bash
kubectl create secret docker-registry <secret name>
--docker-server=https://index.docker.io/v1/
--docker-username=<dockerHub username> --docker-password=<dockerHub password>
--docker-email=<email> -n <namespace>
```

When creating a TFS deployment in Sextant, be sure to use the same namespace you
just created and to add the secret you created as an image pull secret
in the form.
