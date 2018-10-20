const async = require('async')
const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const sawtoothSettings = require('../../templates/sawtooth_settings')
const Deploy = require('../../utils/deploy')
const Pods = require('../../utils/pods')

/*

  wait for the sawtooth pods to be up and running

  params:

   * name
  
*/
const waitForSawtoothPodsTask = (pino, params, store, dispatcher, done) => {
  
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

const undeploySawtoothComplete = (pino, params, store, dispatcher) => (err) => {
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
}

const sharedTasks = {
  waitForSawtoothPodsTask,
  undeploySawtoothComplete,
}

module.exports = sharedTasks