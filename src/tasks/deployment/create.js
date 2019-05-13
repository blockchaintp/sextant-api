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

  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log('here deployment')

  console.log(JSON.stringify(deployment, null, 4))

/*
  // TODO: mock the kubectl handler for tests
  if(!testMode) {
    const clusterKubectl = yield ClusterKubectl({
      cluster,
      store,
    })
  
    // test we can connect to the remote cluster with the details provided
    yield clusterKubectl.jsonCommand('get ns')
  }

  */

  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = DeploymentCreate