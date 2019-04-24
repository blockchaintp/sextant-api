const config = require('../config')

const {
  TASK_ACTION,
} = config

const ClusterCreate = require('./cluster/create')
const ClusterUpdate = require('./cluster/update')
const ClusterDelete = require('./cluster/delete')

module.exports = (params) => {
  return {
    [TASK_ACTION['cluster.create']]: ClusterCreate(params),
    [TASK_ACTION['cluster.update']]: ClusterUpdate(params),
    [TASK_ACTION['cluster.delete']]: ClusterDelete(params),
  }
}