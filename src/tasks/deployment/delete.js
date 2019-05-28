const Promise = require('bluebird')

const DeploymentDelete = ({
  
}) => function* deploymentCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  // delay 1 second to allow the frontend to catch the task status
  yield Promise.delay(1000)
  
}

module.exports = DeploymentDelete