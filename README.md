# sextant-api

Api server for the [sextant](https://github.com/catenasys/sextant) frontend app.

It manages Kubernetes clusters and the installation of sawtooth onto them.

## storage

To manage state - we have abstracted a `store` interface that can be backed by
your choice of persistent storage.

To begin - we are using a `file` implementation that keeps details about each
cluster as files within a folder per cluster.

You can implement an alternative implementation (such as Postgres) and switch
which implementation is used inside [app.js](src/app.js)

## notes

### manifests

In manifest/config-maps.yaml - the following 3 keys need generating and
injecting:

```yaml
SECRET_KEY = 'g7op0ioXPdw7jFTf4aY2'
AES_KEY = '37960e8f0337b90131acfb30b8817d17'
BATCHER_PRIVATE_KEY =
'a8fbe6bb38fb6ae5cc1abbfee9068f734b4c023cc5ffc193a8c9d83793d0ee02'
```

`SECRET_KEY` alphanumeric
`AES_KEY` = hex
`BATCHER_PRIVATE_KEY` = hex

All 3 need to be the same length as above examples

For storageclass - the reclaimPolicy: Delete might need changing

In poet-seed.yaml - the following tp's are optional:

- smallbank-tp
- rbac-tp

#### AWS instance types

There is no api endpoint for listing the instance types offered by AWS.

Thankfully - there is a useful repo that strives to keep this info up-to-date

- [github repo](https://github.com/powdahound/ec2instances.info/)
- [web view](https://ec2instances.info/)

We have downloaded the CSV and imported into the api server, the frontend gets
this info as part of the `/v1/config/values` endpoint.

We should keep this up to date periodically by downloading latest data from
this repo.

Process for downloading and converting CSV file:

- click the `CSV` button from [this page](https://ec2instances.info/)
- convert the CSV into JSON using [this page](https://www.csvjson.com/csv2json)
- save the raw JSON file as `sextant-api/src/data/aws-instances-raw.json`
- process the JSON into a minimal format:

```bash
cat aws-instances-raw.json | jq 'map({name: .Name, apiName: ."API Name",
memory: .Memory, vCPUs: .vCPUs, storage: ."Instance Storage"})'
| sed 's/               / - /g' > aws-instances-minimal.json
```

The api server will consume the
`sextant-api/src/data/aws-instances-minimal.json` file.

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
