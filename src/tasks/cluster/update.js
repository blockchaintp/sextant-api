const async = require('async')
const config = require('../../config')

const taskCompleter = require('./utils/taskCompleter')
const saveAppliedState = require('./utils/saveAppliedState')

const {
  CLUSTER_STATUS,
} = config

const ClusterUpdate = ({
  
}) => (params, done) => {
  
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
    completedStatus: CLUSTER_STATUS.provisioned,
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

      // update the applied_state
      next => saveAppliedState({
        id: task.resource_id,
        store,
        transaction,
      }, next),
  
    ], finish)
  }, completer)
}

module.exports = ClusterUpdate