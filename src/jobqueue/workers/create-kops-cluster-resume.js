const async = require('async')
const pino = require('pino')({
  name: 'worker.createClusterResume',
})
const shared = require('./create-kops-cluster-shared')

/*

  picks up waiting for a creating cluster in the case the process has crashed
  but there is still a cluster in the creating state
  
*/
const CreateKopsClusterResume = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // wait for the cluster to be ready
    next => {
      shared.waitClusterReadyTask(pino, {
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

    // deploy the core manifests
    next => {
      shared.deployCoreManifestsTask(pino, {
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

  ], shared.createClusterComplete(pino, params, store, dispatcher))
}

module.exports = CreateKopsClusterResume