## connect remote clusters

Create the service account:

```bash
kubectl create serviceaccount sextant
```

If RBAC enabled - assign cluster-admin role to service account:

```bash
kubectl create clusterrolebinding sextant-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:sextant
```

Get the secret name for the service account:

```bash
export SECRETNAME=$(kubectl get serviceaccounts sextant -o "jsonpath={.secrets[0].name}")
```

Get the base64 bearer token:

```bash
export BASE64_BEARER_TOKEN=$(kubectl get secret $SECRETNAME -o "jsonpath={.data.token}")
```

Get the base64 CA:

```bash
export BASE64_CA_FILE=$(kubectl get secret $SECRETNAME -o "jsonpath={.data['ca\.crt']}")
```

Get the api server address:

```bash
export APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
```

Print out the details:

```bash
echo '{"apiServer":"'$APISERVER'","token":"'$BASE64_BEARER_TOKEN'","ca":"'$BASE64_CA_FILE'"}'
```