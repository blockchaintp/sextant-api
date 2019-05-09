const saveAppliedState = require('./utils/saveAppliedState')

const DeploymentUpdate = ({
  testMode,
}) => function* deploymentUpdateTask(params) {
  
  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  const deployment = yield store.cluster.get({
    id,
  }, trx)

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = DeploymentUpdate