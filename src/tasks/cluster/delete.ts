import { Knex } from 'knex'
import { Store } from '../../store'
import * as model from '../../store/model/model-types'
import { DEPLOYMENT_STATUS } from '../../config'

export const ClusterDelete = () =>
  function* clusterCreateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
    const { store, task, trx } = params

    // get a list of deployments for this cluster and check they are all in deleted status
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const deployments = yield store.deployment.list(
      {
        cluster: task.resource_id,
        deleted: true,
      },
      trx
    )

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const nonDeletedDeployments = deployments.filter(
      (deployment: { status: string }) => deployment.status !== DEPLOYMENT_STATUS.deleted
    )

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (nonDeletedDeployments.length > 0) throw new Error('all deployments for this cluster must be in deleted state')
  }

module.exports = ClusterDelete
