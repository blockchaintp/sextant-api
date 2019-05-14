const renderTemplates = require('../../deployment_templates/render')
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

  const deployment = yield store.deployment.get({
    id,
  }, trx)

  const {
    deployment_type,
    deployment_version,
    desired_state,
  } = deployment

  const templateDirectory = yield renderTemplates({
    deployment_type,
    deployment_version,
    desired_state,
  })


  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = DeploymentUpdate