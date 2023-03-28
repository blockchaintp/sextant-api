import { Deployment, Task } from '../../../store/model/model-types'
import { Store } from '../../../store'
import { Knex } from 'knex'

export type ClusterDeleteTask = Generator<Promise<unknown>, void, unknown>

export type ClusterDeleteTaskParams = {
  store: Store
  task: Task
  trx: Transaction
}

//export type ClusterDeleteTaskInterfaceArgs

export type ClusterDeleteTaskInterface = () => ClusterDeleteTask

// Scalar Types
type Transaction = Knex.Transaction
type DeploymentList = [Deployment]
