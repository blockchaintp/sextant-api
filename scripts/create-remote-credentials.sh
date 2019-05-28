#!/bin/bash -e

set -e

SERVICEACCOUNT=${SERVICEACCOUNT:="sextant"}
NAMESPACE=${NAMESPACE:="default"}

# create the service account:
echo "creating serviceaccount: $SERVICEACCOUNT in namespace $NAMESPACE"
kubectl create -n $NAMESPACE serviceaccount $SERVICEACCOUNT

# get the RBAC api versions
RBAC_API_VERSIONS=$(kubectl api-versions | grep rbac)

# If RBAC is enabled - assign cluster-admin role to service account:
if [ -n "$RBAC_API_VERSIONS" ]; then
  echo "creating clusterrolebinding: $SERVICEACCOUNT in namespace $NAMESPACE"
  kubectl create -n $NAMESPACE clusterrolebinding $SERVICEACCOUNT \
    --clusterrole=cluster-admin \
    --serviceaccount=$NAMESPACE:$SERVICEACCOUNT
fi
