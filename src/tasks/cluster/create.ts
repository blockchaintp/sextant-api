import { Knex } from 'knex'
import { Store } from '../../store'
import { Kubectl } from '../../utils/kubectl'
import { saveAppliedState } from './utils/saveAppliedState'
import * as model from '../../store/model/model-types'
import { Cluster } from '../../store/model/model-types'

type Options = {
  testMode: boolean
}

export const ClusterCreate = ({ testMode }: Options) =>
  function* clusterCreateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
    const { store, task, trx } = params

    const id = task.resource_id
    const clusterStore = store.cluster

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cluster = yield clusterStore.get(
      {
        id,
      },
      trx
    )

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })

      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const clusterKubectl = yield Kubectl.getKubectlForCluster({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cluster,
      store,
    })

    // test we can connect to the remote cluster with the details provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield clusterKubectl.getNamespaces()

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = ClusterCreate
