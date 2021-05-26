/* eslint-disable no-undef */
const saveAppliedState = require('./utils/saveAppliedState')

const ClusterUpdate = ({
  testMode,
}) => function* clusterUpdateTask(params) {
  const {
    store,
    task,
    trx,
  } = params

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

  // test we can connect to the remote cluster with the details provided
  // eslint-disable-next-line no-unused-vars
  const namespaces = yield clusterKubectl.jsonCommand('get ns')

  yield saveAppliedState({
    id,
    store,
    trx,
  })
}

module.exports = ClusterUpdate
