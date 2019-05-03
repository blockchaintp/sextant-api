const config = require('../../config')

const taskCompleter = require('./utils/taskCompleter')
const saveAppliedState = require('./utils/saveAppliedState')

const {
  CLUSTER_STATUS,
} = config

const ClusterDelete = ({
  
}) => (params, done) => {
  const {
    store,
    task,
    cancelSeries,
  } = params

  const context = {}

  const completer = taskCompleter({
    id: task.resource_id,
    store,
    completedStatus: CLUSTER_STATUS.deleted,
  }, done)

  store.transaction((transaction, finish) => {
    cancelSeries([

      // load the cluster
      next => {
        store.cluster.get({
          id: task.resource_id,
          transaction,
        }, (err, cluster) => {
          if(err) return next(err)
          context.cluster = cluster
          next()
        })
      },
  
    ], finish)
  }, completer)
}

module.exports = ClusterDelete