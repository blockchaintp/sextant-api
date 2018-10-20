const async = require('async')
const pino = require('pino')({
  name: 'worker.deploySawtooth',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const sawtoothSettings = require('../../templates/sawtooth_settings')
const Deploy = require('../../utils/deploy')
const Pods = require('../../utils/pods')

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

  wait for the sawtooth pods to be up and running

  params:

   * name
  
*/
const waitForSawtoothPodsTask = (params, store, dispatcher, done) => {


  async.waterfall([

    // get a kubectl that is bound to the given cluster
    // also get a deploy object bound to that kubectl instance
    (next) => {
      clusterUtils.getKubectl(store, params.name, (err, kubectl) => {
        if(err) return next(err)
        next(null, kubectl)
      })
    },

    // wait for the pods to be ready
    (kubectl, next) => {
      let waitingForPods = true

      const pods = Pods(kubectl)
      async.whilst(
        () => waitingForPods,
        (nextw) => {
          pods.isDeployed((err, status) => {
            if(err) return nextw(err)
            if(status == 'failed') return nextw(`One of the pods failed to start`)
            if(status == 'running') {
              waitingForPods = false
              return nextw()
            }
            else {
              setTimeout(nextw, 1000)
            }
          })
        },
        next,
      )
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
      waitForSawtoothPodsTask({
        name: params.name,
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
        error: err.toString(),
        errorPhase: 'deploy',
      }, () => {})
    }
    else {

      pino.info({
        action: 'success',
        params,
      })

      store.updateClusterStatus({
        clustername: params.name,
        status: {
          phase: 'deployed',
        }
      }, () => {})
      
    }
  })
}

module.exports = DeploySawtoothManifests