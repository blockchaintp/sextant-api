const Kubectl = require('./kubectl')

// return a kubectl instance that is bound to a certain cluster via it's
// kubeconfig file
const getKubectl = (store, clustername, done) => {
  store.getClusterFilePath({
    clustername,
    filename: 'kubeConfig',
  }, (err, kubeconfigPath) => {
    if(err) return done(err)
    const kubectl = Kubectl(kubeconfigPath)
    done(null, kubectl)
  })
}

module.exports = {
  getKubectl,
}