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

  const [ stdout, stderr ] = yield clusterKubectl.command('get nodes')

  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.dir(stdout)

  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = ClusterCreate