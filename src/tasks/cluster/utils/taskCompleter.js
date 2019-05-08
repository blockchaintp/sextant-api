const config = require('../../../config')

const {
  CLUSTER_STATUS,
} = config

// sign off a cluster task with the correct status
// written to the cluster record

const TaskCompleter = ({
  id,
  store,
  completedStatus,
}) => async (err) => {
  if(err) {
    store.cluster.update({
      id,
      data: {
        status: CLUSTER_STATUS.error,
      },
    }, (statusError) => {
      done(err || statusError)
    })
  }
  else {
    store.cluster.update({
      id,
      data: {
        status: completedStatus,
      },
    }, (statusError) => {
      done(statusError)
    })
  }
}

module.exports = TaskCompleter