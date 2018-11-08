const Kubectl = require('./kubectl')

// return a kubectl instance that is bound to a certain cluster via it's
// kubeconfig file
const getKubectl = (store, clustername, done) => {
  const kubeconfigPath = store.getLocalClusterFilePath(clustername, 'kubeConfig')
  const kubectl = Kubectl(kubeconfigPath)
  done(null, kubectl)
}

module.exports = {
  getKubectl,
}