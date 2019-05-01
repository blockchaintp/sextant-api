const config = require('../../config')

const taskCompleter = require('./utils/taskCompleter')
const secretExtractor = require('./utils/secretExtractor')

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

      next => secretExtractor({
        store,
        cluster: context.cluster,
        cancelSeries,
        transaction,
      }, next),
  
    ], finish)
  }, completer)
}

module.exports = ClusterCreate