const async = require('async')
const pino = require('pino')({
  name: 'worker.exportClusterConfigFiles',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')

/*

  once the cluster has been created - export a KUBECONFIG and KOPSCONFIG file
  into the cluster data store

  once this is done - mark the cluster as "created" so the frontend can display
  the cluster information

  params:

    {
      domain: "dev.catenasys.com.",
      name: "apples",
    }

*/

const ExportClusterConfigFiles = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([
    
    // export a kubeconfig file for this cluster
    // this will be used anytime we run `kubectl` against this cluster
    next => {

      const kubeConfigPath = store.getClusterFilePath({
        clustername: params.name,
        filename: 'kubeConfig',
      })

      const exportKubeConfigParams = {
        name: params.name,
        domain: params.domain,
        kubeConfigPath
      }

      pino.info({
        action: 'exportKubeConfig',
        params: exportKubeConfigParams,
      })

      kops.exportKubeConfig(exportKubeConfigParams, next)

    },

    // export a kops config file for this cluster
    // this can be downloaded as an export for the cluster
    next => {

      const kopsConfigPath = store.getClusterFilePath({
        clustername: params.name,
        filename: 'kopsConfig',
      })

      const exportKopsConfigParams = {
        name: params.name,
        domain: params.domain,
        kopsConfigPath
      }

      pino.info({
        action: 'exportKopsConfig',
        params: exportKopsConfigParams,
      })

      kops.exportKopsConfig(exportKopsConfigParams, next)
    },

  ], (err) => {
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

module.exports = ExportClusterConfigFiles