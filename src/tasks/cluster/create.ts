import { Knex } from 'knex'
import { Store } from '../../store'
import { Kubectl } from '../../utils/kubectl'
import { saveAppliedState } from './utils/saveAppliedState'
import * as model from '../../store/model/model-types'

const ClusterCreate = ({ testMode }: { testMode: boolean }) =>
  function* clusterCreateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
    const { store, task, trx } = params

    const id = task.resource_id

    const cluster = yield store.cluster.get(
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

    const clusterKubectl = yield Kubectl.getKubectlForCluster({
      cluster,
      store,
    })

    // test we can connect to the remote cluster with the details provided
    yield clusterKubectl.getNamespaces()

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = ClusterCreate
