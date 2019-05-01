const async = require('async')
const config = require('../../config')

const taskCompleter = require('./utils/taskCompleter')

const {
  CLUSTER_STATUS,
} = config

const ClusterUpdate = (params, done) => {
  
  const {
    store,
    task,
    cancelSeries,
  } = params

  const context = {}

  // writes the end status of the task back to the cluster
  const completer = taskCompleter({
    id: task.resource_id,
    store,
    completedStatus: CLUSTER_STATUS.provisioned
  }, done)

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
            if(!token) return nextp()
            store.clustersecret.replace({
              data: {
                cluster: context.cluster.id,
                name: 'token',
                base64Data: token,
              },
              transaction,
            }, nextp)
          },
  
          ca: nextp => {
            if(!ca) return nextp()
            store.clustersecret.replace({
              data: {
                cluster: context.cluster.id,
                name: 'ca',
                base64Data: ca,
              },
              transaction,
            }, nextp)
          },

        }, next)
      },

      // if the cluster type is remote - delete the token and ca from the desired_state
      next => {
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
  }, completer)
}

module.exports = ClusterUpdate