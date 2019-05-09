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

  try {
    const [ data, stderr ] = yield clusterKubectl.jsonCommand('get ns')
  } catch(err) {
    throw new Error('could not connect to the cluster with those details')
  }
  
  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = ClusterCreate