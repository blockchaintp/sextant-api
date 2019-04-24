const async = require('async')
const config = require('../../config')

const {
  CLUSTER_STATUS,
} = config

const ClusterCreate = (params, done) => {

  const {
    store,
    task,
    cancelSeries,
  } = params

  const context = {}

  store.transaction((transaction, finish) => {
    cancelSeries([

      // load the cluster
      next => {
        store.cluster.get({
          id: task.resource_id,
        }, (err, cluster) => {
          if(err) return next(err)
          context.cluster = cluster
          next()
        })
      },
  
      // if the provision type is remote
      // extract the token and ca and save them as clustersecrets
      next => {

        const {
          cluster,
        } = context

        if(cluster.provision_type == 'local') return next()

        const {
          token,
          ca,
        } = cluster.desired_state
  
        async.parallel({
          token: nextp => {
            store.clustersecret.create({
              data: {
                cluster: context.cluster.id,
                name: 'token',
                base64Data: token,
              },
              transaction,
            }, nextp)
          },
  
          ca: nextp => {
            store.clustersecret.create({
              data: {
                cluster: context.cluster.id,
                name: 'ca',
                base64Data: ca,
              },
              transaction,
            }, nextp)
          },

          test: nextp => nextp('this is an error'),
        }, next)
      },

      // if the cluster type is remote - delete the token and ca from the desired_state
      next => {

        console.log('--------------------------------------------')
        console.log('--------------------------------------------')
        console.log('shoould not get here')
        const {
          cluster,
        } = context

        if(cluster.provision_type == 'local') return next()

        const desired_state = Object.assign({}, cluster.desired_state)
        delete(desired_state.token)
        delete(desired_state.ca)

        store.cluster.update({
          id: cluster.id,
          data: {
            desired_state,
          },
          transaction,
        }, next)
      },
  
    ], finish)
  }, (err) => {
    const {
      cluster,
    } = context
    if(err) {
      store.cluster.update({
        id: cluster.id,
        data: {
          status: CLUSTER_STATUS.error,
        },
      }, (statusError) => {
        done(err || statusError)
      })
    }
    else {
      store.cluster.update({
        id: cluster.id,
        data: {
          status: CLUSTER_STATUS.provisioned,
        },
      }, (statusError) => {
        done(statusError)
      })
    }
  })
}

module.exports = ClusterCreate