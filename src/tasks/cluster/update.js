/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const ClusterKubectl = require('../../utils/clusterKubectl')
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

  const cluster = yield store.cluster.get({
    id,
  }, trx)

  // TODO: mock the kubectl handler for tests
  if(testMode) {
    yield saveAppliedState({
      id,
      store,
      trx
    })
    return
  }

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  const namespaces = yield clusterKubectl.jsonCommand('get ns')

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = ClusterUpdate
