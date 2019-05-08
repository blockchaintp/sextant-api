const config = require('../../config')

const {
  CLUSTER_STATUS,
} = config

const ClusterCreate = ({
  
}) => function* clusterCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  try {
    const cluster = yield store.cluster.get({
      id: task.resource_id,
    }, trx)
  
    yield store.cluster.update({
      id,
      data: {
        applied_state: cluster.desired_state,
        status: CLUSTER_STATUS.provisioned,
      },
    }, trx)
  } catch(err) {
    yield store.cluster.update({
      id,
      data: {
        status: CLUSTER_STATUS.error,
      },
    })
    throw err
  }
}

module.exports = ClusterCreate