const templateUtils = require('../../deployment_templates/utils')
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

  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.dir(deployment)

  const {
    deployment_type,
    deployment_version,
    desired_state,
  } = deployment

  const templateData = yield templateUtils.getTemplateData({
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