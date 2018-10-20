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

      store.getClusterFilePath({
        clustername: params.name,
        filename: 'deploymentValues',
      }, (err, deploymentYamlPath) => {
        if(err) return next(err)
        const context = {
          deploymentYamlPath
        }
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
      context.deploy.sawtoothManifestsDelete({
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
          pods.isUndeployed((err, status) => {
            if(err) return nextw(err)
            if(status == 'terminated') {
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
        errorPhase: 'undeploy',
      }, () => {})
    }
    else {

      pino.info({
        action: 'success',
        params,
      })

      // everything is undeployed - put the cluster into a 'created' state
      store.updateClusterStatus({
        clustername: params.name,
        status: {
          phase: 'created',
        }
      }, () => {})      
    }
  })
}

module.exports = UndeploySawtoothManifests