import { DEPLOYMENT_STATUS } from '../../config'
import { ClusterDeleteTaskParams, ClusterDeleteTask } from './types/delete'
import { Deployment } from '../../store/model/model-types'

const ClusterDelete = () =>
  function* clusterCreateTask(params: ClusterDeleteTaskParams): ClusterDeleteTask {
    // why is this named 'create'?
    const { store, task, trx } = params

    // get a list of deployments for this cluster and check they are all in deleted status
    const deployments = yield store.deployment.list(
      {
        cluster: task.resource_id,
        deleted: true,
      },
      trx
    )

    typeof deployments = [Deployment] // can I sort of re-type or force-type at this stage of the interation?
    const nonDeletedDeployments = deployments.filter((deployment) => deployment.status !== DEPLOYMENT_STATUS.deleted)

    if (nonDeletedDeployments.length > 0) throw new Error('all deployments for this cluster must be in deleted state')
  }

module.exports = ClusterDelete
