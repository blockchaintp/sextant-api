const ClusterKubectl = require('../../utils/clusterKubectl')
const saveAppliedState = require('./utils/saveAppliedState')

const ClusterUpdate = ({
  
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

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  const namespaces = yield clusterKubectl.jsonCommand('get ns')

  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.dir(namespaces)

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = ClusterUpdate