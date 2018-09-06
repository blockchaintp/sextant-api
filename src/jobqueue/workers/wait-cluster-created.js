const async = require('async')
const pino = require('pino')({
  name: 'worker.waitClusterReady',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')

/*

  wait for a given kops cluster to have been created
  and update the "status" in the store when it is ready

  params:

    {
      domain: "dev.catenasys.com.",
      name: "apples",
    }

*/

const WaitClusterCreated = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
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

    (err) => {
      if(err) {

        pino.error({
          action: 'error',
          params,
          error: err,
        })

        // if there has been an error in validating the cluster - tell the store
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

        // the cluster is ready - trigger the export-cluster-config-files job
        // so we have a KUBECONFIG and KOPSCONFIG file for the cluster in the store
        dispatcher({
          name: 'exportClusterConfigFiles',
          {
            name: params.name,
            domain: params.domain,
          },
        }, () => {})

      }
    }
  )
}

module.exports = WaitClusterCreated