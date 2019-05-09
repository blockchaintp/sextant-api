const saveAppliedState = require('./utils/saveAppliedState')

const DeploymentCreate = ({
  testMode,
}) => function* deploymentCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  const deployment = yield store.deployment.get({
    id,
  }, trx)

  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = DeploymentCreate