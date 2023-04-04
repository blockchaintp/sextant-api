import { ClusterCreate } from './cluster/create'
import { ClusterUpdate } from './cluster/update'
import { ClusterDelete } from './cluster/delete'
import { DeploymentCreate } from './deployment/create'
import { DeploymentUpdate } from './deployment/update'
import { DeploymentDelete } from './deployment/delete'

import { TASK_ACTION } from '../config'

module.exports = (opts: { testMode: boolean }) => ({
  [TASK_ACTION['cluster.create']]: ClusterCreate(opts),
  [TASK_ACTION['cluster.update']]: ClusterUpdate(opts),
  [TASK_ACTION['cluster.delete']]: ClusterDelete(),
  [TASK_ACTION['deployment.create']]: DeploymentCreate(opts),
  [TASK_ACTION['deployment.update']]: DeploymentUpdate(opts),
  [TASK_ACTION['deployment.delete']]: DeploymentDelete(opts),
})
