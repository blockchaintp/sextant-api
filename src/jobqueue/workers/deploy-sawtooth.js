const async = require('async')
const pino = require('pino')({
  name: 'worker.deploySawtooth',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const sawtoothSettings = require('../../templates/sawtooth_settings')
const Deploy = require('../../utils/deploy')
const shared = require('./deploy-sawtooth-shared')

/*

  depoloy the sawtootbh manifests based on the input from the GUI
  
*/


/*

  deploy the core manifests

  params:

   * name
  
*/
const deploySawtoothManifestsTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'deploySawtoothManifestsTask',
    params,
  })

  async.waterfall([

    // first - load the cluster settings
    (next) => {
      async.parallel({
        clusterSettings: nextp => store.getClusterSettings({
          clustername: params.name,
        }, nextp),
        deploymentSettings: nextp => store.getDeploymentSettings({
          clustername: params.name,
        }, nextp),
      }, next)
      
    },

    // output the deploymentValues.yaml file and get a path to it
    (context, next) => {

      const yaml = sawtoothSettings.getYaml(context.clusterSettings, context.deploymentSettings)

      store.writeClusterFile({
        clustername: params.name,
        filename: 'deploymentValues',
        data: sawtoothSettings.getYaml(context.clusterSettings, context.deploymentSettings),
      }, (err, deploymentYamlPath) => {
        if(err) return next(err)
        context.deploymentYamlPath = deploymentYamlPath
        next(null, context)
      })
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
      context.deploy.sawtoothManifestsApply({
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
      }, store, dispatcher, next)
    },

    // wait for the manifests to be ready
    next => {
      shared.waitForSawtoothPodsTask(pino, {
        name: params.name,
      }, store, dispatcher, next)
    },

  ], shared.deploySawtoothComplete(pino, params, store, dispatcher))
}

module.exports = DeploySawtoothManifests