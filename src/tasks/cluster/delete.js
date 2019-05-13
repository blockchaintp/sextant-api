const Promise = require('bluebird')

const ClusterDelete = ({
  
}) => function* clusterCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  // delay 1 second to allow the frontend to catch the task status
  yield Promise.delay(1000)

  
}

module.exports = ClusterDelete