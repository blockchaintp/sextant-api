const ClusterCreate = require('./cluster/create')
const ClusterUpdate = require('./cluster/update')
const ClusterDelete = require('./cluster/delete')
const DeploymentCreate = require('./deployment/create')
const DeploymentUpdate = require('./deployment/update')
const DeploymentDelete = require('./deployment/delete')

const config = require('../config')

const { TASK_ACTION } = config

module.exports = (opts) => ({
  [TASK_ACTION['cluster.create']]: ClusterCreate(opts),
  [TASK_ACTION['cluster.update']]: ClusterUpdate(opts),
  [TASK_ACTION['cluster.delete']]: ClusterDelete(),
  [TASK_ACTION['deployment.create']]: DeploymentCreate(opts),
  [TASK_ACTION['deployment.update']]: DeploymentUpdate(opts),
  [TASK_ACTION['deployment.delete']]: DeploymentDelete(opts),
})
