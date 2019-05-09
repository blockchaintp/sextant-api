const saveAppliedState = require('./utils/saveAppliedState')

const ClusterCreate = ({
  
}) => function* clusterCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  yield saveAppliedState({
    id,
    store,
    trx,
  })
}

module.exports = ClusterCreate