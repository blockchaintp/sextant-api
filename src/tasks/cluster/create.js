const Promise = require('bluebird')

const ClusterKubectl = require('../../utils/clusterKubectl')
const saveAppliedState = require('./utils/saveAppliedState')

const ClusterCreate = ({
  
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

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  yield clusterKubectl.jsonCommand('get ns')

  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = ClusterCreate