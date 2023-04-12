import { TaskStore } from '../../store/task'
import { clusterCreateError, clusterDeleteError, clusterUpdateError } from './clusterStatusUpdaters'
import { deploymentCreateError, deploymentDeleteError, deploymentUpdateError } from './deploymentStatusUpdaters'
import * as model from '../../store/model/model-types'

const defaultTaskError = async (task: model.Task, store: TaskStore) => {
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
  'cluster.create': clusterCreateError,
  'cluster.update': clusterUpdateError,
  'cluster.delete': clusterDeleteError,

  'deployment.create': deploymentCreateError,
  'deployment.update': deploymentUpdateError,
  'deployment.delete': deploymentDeleteError,

  default: defaultTaskError,

  // completed tasks resource updater is currently defined in the taskprocessor
  // but could be added here in the future using the same pattern as above
}

module.exports = resourceUpdaters
