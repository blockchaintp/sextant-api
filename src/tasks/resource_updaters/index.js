const {
  clusterCreateError,
  clusterDeleteError,
  clusterUpdateError
} = require('./clusterStatusUpdaters')
const {
  deploymentCreateError,
  deploymentDeleteError,
  deploymentUpdateError
} = require('./deploymentStatusUpdaters')



const defaultTaskError = async (task, store) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
    },
  })
}

/*
  unique resource updater functions based around errors
*/

const resourceUpdaters = {
  // resource updaters for errored tasks
  'cluster.create' : clusterCreateError,
  'cluster.update': clusterUpdateError,
  'cluster.delete': clusterDeleteError,

  'deployment.create': deploymentCreateError,
  'deployment.update': deploymentUpdateError,
  'deployment.delete': deploymentDeleteError,

  'default': defaultTaskError

  // completed tasks resource updater is currently defined in the taskprocessor 
  // but could be added here in the future using the same pattern as above
}


module.exports = resourceUpdaters