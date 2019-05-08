## running a local cluster

It is useful to run a k8s cluster locally for testing.

To do this we use [kind](https://kind.sigs.k8s.io/) (Kubernetes IN Docker).

First [install it](https://kind.sigs.k8s.io/#installation-and-usage).

Then start a cluster:

```bash
kind create cluster
```

This will create a cluster inside a container called `kind-control-plane`

It will print out the following instructions for connecting your local kubectl:

```bash
export KUBECONFIG="$(kind get kubeconfig-path --name="kind")"
kubectl cluster-info
```

### connect to cluster from inside api container

The above will work from your host - it binds to a port on `127.0.0.1`

However - the api server container won't be able to see it.  For this to work you need to attach the kind container to the same network as the sextant stack.

First - get the network name the sextant stack is running on:

```bash
docker network ls
```

NOTE - for local development using the `sextant-dev` repo this will normally be `sextant-dev_default`

Then - we attach the `kind-control-plane` container to the `sextant-dev_default` network:

```bash
docker network connect sextant-dev_default kind-control-plane
```

Now - the api container will be able to connect to the kind cluster using the URL `https://kind-control-plane:6443`

### adding credentials to sextant

Finally - we want to add the kind cluster to sextant as a `remote` cluster.

On your host - run through the [connect-remote-credentials.md](connect-remote-credentials.md)

However - you must change the apiServer that is reported to be `https://kind-control-plane:6443`

The token and ca remain the same.