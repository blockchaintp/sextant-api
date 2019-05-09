const saveAppliedState = require('./utils/saveAppliedState')

const ClusterUpdate = ({
  
}) => function* clusterUpdateTask(params) {
  
  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = ClusterUpdate