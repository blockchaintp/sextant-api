const async = require('async')
const pino = require('pino')({
  name: 'worker.deploySawtoothManifests',
})

const settings = require('../../settings')
const clusterUtils = require('../../utils/cluster')
const Deploy = require('../../deploy')

/*

  generate and deploy the sawtooth manifests for a given cluster
  
  {
    name: "apples",
  }

*/

const DeploySawtoothManifests = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  const context = {}

  async.series([

    // first - load the cluster settings
    next => {
      store.getClusterSettings({
        clustername: params.name,
      }, (err, clusterSettings) => {
        if(err) return next(err)
        context.clusterSettings = clusterSettings
        next()
      }) 
    },

    // get a kubectl that is bound to the given cluster
    // also get a deploy object bound to that kubectl instance
    next => {
      clusterUtils.getKubectl(store, params.name, (err, kubectl) => {
        if(err) return next(err)
        context.kubectl = kubectl
        context.deploy = Deploy({
          kubectl
        })
        next()
      })
    },

    // generate the YAML template and deploy it
    next => {
      context.deploy.sawtoothManifests({
        clusterSettings: context.clusterSettings,
      }, next)
    }

  ], (err) => {
    if(err) {

      pino.error({
        action: 'error',
        params,
        error: err,
      })

    }
    else {

      pino.info({
        action: 'success',
        params,
      })
    }
  })
}

module.exports = DeploySawtoothManifests