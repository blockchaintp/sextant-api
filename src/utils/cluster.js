const Kubectl = require('./kubectl')

// return a kubectl instance that is bound to a certain cluster via it's
// kubeconfig file
const getKubectl = (store, clustername, done) => {
  const kubeconfigPath = store.getLocalClusterFilePath(clustername, 'kubeConfig')
  const kubectl = Kubectl(kubeconfigPath)
  done(null, kubectl)
}

/*
  
  extract the cluster secrets from the desired state
  this is so we never save secrets inside of tasks or cluster records
  they are only saved in the clustersecret store (which can be replaced later)
  the desired_state of the cluster will hold a reference to the id of the secret

  will return an object with these props:

    * desired_state - the desired_state with the secrets extracted
    * secrets - an object of name onto an object with either base64Data or rawData

*/
const extractClusterSecrets = ({
  desired_state,
}) => {

  const secrets = {}

  if(!desired_state) return {
    desired_state,
    secrets,
  }

  const returnDesiredState = Object.assign({}, desired_state)

  if(returnDesiredState.token) {
    secrets.token = {
      base64Data: returnDesiredState.token,
    }
    delete(returnDesiredState.token)
  }

  if(returnDesiredState.ca) {
    secrets.ca = {
      base64Data: returnDesiredState.ca,
    }
    delete(returnDesiredState.ca)
  }

  return {
    desired_state: returnDesiredState,
    secrets,
  }
}

module.exports = {
  getKubectl,
  extractClusterSecrets,
}