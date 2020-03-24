const clusterStatusUpdater = require('./cluster')
const deploymentStuatusUpdater = require('./deployment')

/*
  allows us to create unique resource updater functions based around errors
*/

const resourceUpdater = async (task, action, error, store) => {
  // tasks have actions in the form of 'deployment.create' , 'deployment.update' etc.. so we match on the resource type only

  const deploymentRegex = new RegExp('deployment')
  const clusterRegex = new RegExp('cluster')

  // if the action is on a deployment use the deployment updater function
  if (deploymentRegex.test(action)) {
    deploymentStatusUpdater(task, error, store)
  }
  // if the action is on a cluster, use the cluster updator function
  else if (clusterRegex.test(action)) {
    clusterStatusUpdater(task, error, store)
  } 
  // by default, update the resource status with the resource_status value
  else {
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

module.exports = resourceUpdater