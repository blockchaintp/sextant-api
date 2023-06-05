/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-undef */
const { saveAppliedState } = require('./utils/saveAppliedState')
const { Kubectl } = require('../../utils/kubectl')

const ClusterUpdate = ({ testMode }) =>
  function* clusterUpdateTask(params) {
    const { store, task, trx } = params

    const id = task.resource_id

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const cluster = yield store.cluster.get(
      {
        id,
      },
      trx
    )

    const clusterKubectl = yield Kubectl.getKubectlForCluster({
      cluster,
      store,
    })

    // test we can connect to the remote cluster with the details provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    yield clusterKubectl.getNamespaces()

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = ClusterUpdate
