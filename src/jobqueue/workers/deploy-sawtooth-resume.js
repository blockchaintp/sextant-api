const async = require('async')
const pino = require('pino')({
  name: 'worker.deploySawtoothResume',
})
const shared = require('./deploy-sawtooth-shared')

/*

  picks up waiting for a deploying cluster in the case the process has crashed
  but there is still a cluster in the deploying state
  
*/
const DeploySawtoothManifestsResume = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // wait for the manifests to be ready
    next => {
      shared.waitForSawtoothPodsTask(pino, {
        name: params.name,
      }, store, dispatcher, next)
    },

  ], shared.deploySawtoothComplete(pino, params, store, dispatcher))
}

module.exports = DeploySawtoothManifestsResume