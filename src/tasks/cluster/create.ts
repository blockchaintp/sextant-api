import { Kubectl } from '../../utils/kubectl'
import { ClusterCreateTask, ClusterCreateTaskInterfaceArgs, ClusterCreateTaskParams } from './types/create'
import { saveAppliedState } from './utils/saveAppliedState'
import { Store } from '../../store'
import { Cluster } from '../../store/model/model-types'

const ClusterCreate = ({ testMode }: ClusterCreateTaskInterfaceArgs) =>
  function* clusterCreateTask(params: ClusterCreateTaskParams): ClusterCreateTask {
    const { store, task, trx } = params

    const id = task.resource_id

    const cluster: unknown = yield store.cluster.get({ id }, trx)

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })

      return
    }

    const kubectl = new Kubectl(cluster)
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
