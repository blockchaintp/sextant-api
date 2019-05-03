const ClusterCreate = require('./cluster/create')
const ClusterUpdate = require('./cluster/update')
const ClusterDelete = require('./cluster/delete')

const config = require('../config')

const {
  TASK_ACTION,
} = config

module.exports = (opts) => ({
  [TASK_ACTION['cluster.create']]: ClusterCreate(opts),
  [TASK_ACTION['cluster.update']]: ClusterUpdate(opts),
  [TASK_ACTION['cluster.delete']]: ClusterDelete(opts),
})