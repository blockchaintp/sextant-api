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

  yield saveAppliedState({
    id,
    store,
    trx,
  })
}

module.exports = ClusterUpdate
