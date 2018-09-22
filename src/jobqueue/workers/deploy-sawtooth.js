const async = require('async')
const pino = require('pino')({
  name: 'worker.createCluster',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const Deploy = require('../../deploy')

/*

  depoloy the sawtootbh manifests based on the input from the GUI
  
*/


/*

  deploy the core manifests

  params:

   * name
   * domain
  
*/
const deploySawtoothManifestsTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'deploySawtoothManifestsTask',
    params,
  })

  async.waterfall([

    // first - load the cluster settings
    (next) => {
      store.getClusterSettings({
        clustername: params.name,
      }, next)
    },

    // get a kubectl that is bound to the given cluster
    // also get a deploy object bound to that kubectl instance
    (clusterSettings, next) => {
      clusterUtils.getKubectl(store, params.name, (err, kubectl) => {
        if(err) return next(err)
        const deploy = Deploy({
          kubectl
        })
        next(null, {
          clusterSettings,
          deploy,
          kubectl,
        })
      })
    },

    // generate the YAML template and deploy it
    (context, next) => {
      context.deploy.sawtoothManifests({
        clusterSettings: context.clusterSettings,
      }, next)
    }

  ], done)
}

const DeploySawtoothManifests = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // deploy the sawtooth manifests
    next => {
      deploySawtoothManifestsTask({
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

  ], (err) => {
    if(err) {

      pino.error({
        action: 'error',
        params,
        error: err,
      })

      // if there has been an error in creating the cluster - tell the store
      // to put the cluster into an error state
      store.setClusterError({
        clustername: params.name,
        error: err.toString()
      }, () => {})
    }
    else {

      pino.info({
        action: 'success',
        params,
      })

      // everything is ready - put the cluster into a 'created' state
      store.updateClusterStatus({
        clustername: params.name,
        status: {
          phase: 'created',
        }
      }, () => {})
    }
  })
}

module.exports = DeploySawtoothManifests