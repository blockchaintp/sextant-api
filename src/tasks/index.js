const ClusterCreate = require('./cluster/create')
const ClusterUpdate = require('./cluster/update')
const ClusterDelete = require('./cluster/delete')

module.exports = {
  'cluster.create': ClusterCreate,
  'cluster.update': ClusterUpdate,
  'cluster.delete': ClusterDelete,
}