const ClusterKubectl = require('../../utils/clusterKubectl')
const saveAppliedState = require('./utils/saveAppliedState')

const ClusterCreate = ({
  testMode,
}) => function* clusterCreateTask(params) {
  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  const cluster = yield store.cluster.get({
    id,
  }, trx)

  // TODO: mock the kubectl handler for tests
  if (testMode) {
    yield saveAppliedState({
      id,
      store,
      trx,
    })

    return
  }

  const clusterKubectl = yield ClusterKubectl({
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
