#!/bin/bash -e

set -e

SERVICEACCOUNT=${SERVICEACCOUNT:="sextant"}
NAMESPACE=${NAMESPACE:="default"}

# get the secret name for the service account:
echo "getting the secret name for serviceaccount: $SERVICEACCOUNT in namespace $NAMESPACE"
SECRETNAME=$(kubectl get -n $NAMESPACE serviceaccounts sextant -o "jsonpath={.secrets[0].name}")

# get the base64 bearer token:
echo "getting the bearer token for serviceaccount: $SERVICEACCOUNT in namespace $NAMESPACE"
BASE64_BEARER_TOKEN=$(kubectl get secret -n $NAMESPACE $SECRETNAME -o "jsonpath={.data.token}")

# get the base64 CA:
echo "getting the certificate authority for serviceaccount: $SERVICEACCOUNT in namespace $NAMESPACE"
BASE64_CA_FILE=$(kubectl get secret -n $NAMESPACE $SECRETNAME -o "jsonpath={.data['ca\.crt']}")

# get the api server address:
echo "getting the api server address"
APISERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')

# print out the details:
echo
echo "your access credentials are printed below - copy everything below the dotted lines"
echo
echo "------------------------------------------"
echo
echo '{"apiServer":"'$APISERVER'","token":"'$BASE64_BEARER_TOKEN'","ca":"'$BASE64_CA_FILE'"}'