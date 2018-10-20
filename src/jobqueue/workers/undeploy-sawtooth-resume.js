const async = require('async')
const pino = require('pino')({
  name: 'worker.undeploySawtoothResume',
})
const shared = require('./undeploy-sawtooth-shared')

/*

  picks up waiting for a undeploying cluster in the case the process has crashed
  but there is still a cluster in the undeploying state
  
*/
const UndeploySawtoothManifestsResume = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // wait for the manifests to be terminated
    next => {
      shared.waitForSawtoothPodsTask(pino, {
        name: params.name,
      }, store, dispatcher, next)
    },

  ], shared.undeploySawtoothComplete(pino, params, store, dispatcher))
}

module.exports = UndeploySawtoothManifestsResume