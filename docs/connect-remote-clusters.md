## connect remote clusters

To connect remote clusters we need:

 * the api server address
 * a service account with `cluster-admin` role
  * an access token
  * a certificate authority

Assuming we have `kubectl` access onto a cluster, we first create the service account and assign the cluster-admin role.

TODO: isolate the permissions sextant needs and turn that into a more fine grained RBAC role so we don't need cluster-admin

We decide upon the name of the service account and then namespace it will live in:

```
export SERVICEACCOUNT=sextant
export NAMESPACE=default
```

Then we run the [create-remote-credentials.sh](../scripts/create-remote-credentials.sh) script.

Then we run the [get-remote-credentials.sh](../scripts/get-remote-credentials.sh) script.

This will print out the apiServer, token and ca values that you need to submit to the sextant-api.

You can test these values.  

Copy the ca value and write it to a file like this:

```bash
echo -n '<BASE64 CA value from get-remote-credentials.sh>' | base64 -d > ca.txt
```

Then - get the decoded token:

```bash
export TOKEN=$(echo -n '<BASE64 CA value from get-remote-credentials.sh>' | base64 -d)
```

Finally copy the apiserver:

```bash
export API_SERVER='<api server value from get-remote-credentials.sh>'
```

We can use kubectl with these values:

```bash
kubectl --server $API_SERVER --token $TOKEN --certificate-authority ca.txt get no
```