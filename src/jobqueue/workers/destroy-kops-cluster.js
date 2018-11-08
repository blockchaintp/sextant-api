const async = require('async')
const pino = require('pino')({
  name: 'worker.destroyCluster',
})

const kops = require('../../utils/kops')

/*

  destroy a kops cluster

  params:

    {
      domain: "dev.catenasys.com.",
      name: "apples",
    }

*/

const DestroyKopsCluster = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  let bucket = null

  async.series([

    next => store.readObjectStoreName((err, b) => {
      if(err) return next(err)
      bucket = b
      next()
    }),
    
    // call kops to destroy the cluster
    next => {
      pino.info({
        action: 'kops.destroyCluster',
        params,
      })
      kops.destroyCluster({
        name: params.name,
        domain: params.domain,
        bucket,
      }, next)
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

      // the cluster is deleted - update it's status
      store.updateClusterStatus({
        clustername: params.name,
        status: {
          phase: 'deleted',
        }
      }, () => {})
    }
  })
}

module.exports = DestroyKopsCluster