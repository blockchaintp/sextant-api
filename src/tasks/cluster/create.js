/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Kubectl } = require('../../utils/kubectl')
const saveAppliedState = require('./utils/saveAppliedState')

const ClusterCreate = ({ testMode }) =>
  function* clusterCreateTask(params) {
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
