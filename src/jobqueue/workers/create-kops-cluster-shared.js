const async = require('async')
const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const Deploy = require('../../utils/deploy')
const Pods = require('../../utils/pods')

/*

  wait for the cluster to be ready

  params:

   * name
   * domain
  
*/

const waitClusterReadyTask = (pino, params, store, dispatcher, done) => {
  pino.info({
    action: 'waitClusterReadyTask',
    params,
  })

  let lastExitCode = 1
  let attempts = 0

  async.whilst(

    // keep looping until the 'validate' exit code is zero
    () => lastExitCode > 0,

    (next) => {
      attempts++
      if(attempts > settings.validateClusterAttempts) return next(`cluster has not validated after ${settings.validateClusterAttempts} attempts`)

      pino.info({
        action: 'validateCluster',
        params,
      })
    
      // validate the cluster and expect an error if the cluster is not ready
      // the lack of an error means we got a zero exit code and the loop will end
      kops.validateCluster(params, (err) => {
        if(err) {
          lastExitCode = err.code
          setTimeout(next, settings.validateClusterDelay)
        }
        else {
          lastExitCode = 0
          next()
        }
      })
    },

    done
  )
}

/*

  deploy the core manifests

  params:

   * name
   * domain
  
*/
const deployCoreManifestsTask = (pino, params, store, dispatcher, done) => {
  pino.info({
    action: 'deployCoreManifestsTask',
    params,
  })

  async.waterfall([

    // get a kubectl that is bound to the given cluster
    (next) => clusterUtils.getKubectl(store, params.name, next),

    (kubectl, next) => {

      const deploy = Deploy({
        kubectl
      })

      async.series([

        // create the cluster admin service account
        nexts => deploy.createClusterAdminServiceAccount({}, nexts),

        // create the dashboard service account
        nexts => deploy.createDashboardServiceAccount({}, nexts),
        
        // deploy the dashboard
        nexts => deploy.dashboard({}, nexts),

        // deploy the route53 mapper
        nexts => deploy.route53Mapper({}, nexts),

      ], next)
      
    },

  ], done)
}

/*

  shared completer for the deploy sawtooth tasks
  
*/
const createClusterComplete = (pino, params, store, dispatcher) => (err) => {
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
      errorPhase: 'create',
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
}

const sharedTasks = {
  waitClusterReadyTask,
  deployCoreManifestsTask,
  createClusterComplete,
}

module.exports = sharedTasks