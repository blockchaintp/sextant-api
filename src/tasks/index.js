const config = require('../config')

const {
  TASK_ACTION,
} = config

const ClusterCreate = require('./cluster/create')
const ClusterUpdate = require('./cluster/update')
const ClusterDelete = require('./cluster/delete')

module.exports = {
  [TASK_ACTION['cluster.create']]: ClusterCreate,
  [TASK_ACTION['cluster.update']]: ClusterUpdate,
  [TASK_ACTION['cluster.delete']]: ClusterDelete,
}