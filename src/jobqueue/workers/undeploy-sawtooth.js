const async = require('async')
const pino = require('pino')({
  name: 'worker.undeploySawtooth',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const sawtoothSettings = require('../../templates/sawtooth_settings')
const Deploy = require('../../utils/deploy')
const Pods = require('../../utils/pods')
const shared = require('./undeploy-sawtooth-shared')

/*

  undepoloy the sawtootbh manifests based on the input from the GUI
  
*/


/*

  undeploy the core manifests

  params:

   * name
  
*/
const undeploySawtoothManifestsTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'undeploySawtoothManifestsTask',
    params,
  })

  async.waterfall([

    // get the path to the deploymentValues.yaml file
    (next) => {
      const context = {
        deploymentYamlPath: store.getLocalClusterFilePath(params.name, 'deploymentValues')
      }
      next(null, context)
    },

    // get a kubectl that is bound to the given cluster
    // also get a deploy object bound to that kubectl instance
    (context, next) => {
      clusterUtils.getKubectl(store, params.name, (err, kubectl) => {
        if(err) return next(err)
        context.deploy = Deploy({
          kubectl
        })
        context.kubectl = kubectl
        next(null, context)
      })
    },

    // generate the YAML templates and deploy them
    (context, next) => {
      context.deploy.sawtoothManifestsDelete({
        deploymentYamlPath: context.deploymentYamlPath,
      }, next)
    }

  ], done)
}

/*

  deploy the sawtooth manifests based on the saved deployment settings

  params:

   * name
  
*/
const UndeploySawtoothManifests = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // undeploy the sawtooth manifests
    next => {
      undeploySawtoothManifestsTask({
        name: params.name,
      }, store, dispatcher, next)
    },

    // wait for the manifests to be terminated
    next => {
      shared.waitForSawtoothPodsTask(pino, {
        name: params.name,
      }, store, dispatcher, next)
    },

  ], shared.undeploySawtoothComplete(pino, params, store, dispatcher))
}

module.exports = UndeploySawtoothManifests