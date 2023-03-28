import { Task } from '../../../store/model/model-types'
import { Store } from '../../../store'
import { Knex } from 'knex'

export type ClusterCreateTask = Generator<Promise<unknown>, void, unknown>

export type ClusterCreateTaskParams = {
  store: Store
  task: Task
  trx: Transaction
}

export type ClusterCreateTaskInterfaceArgs = {
  testMode: boolean
}

export type ClusterCreateTaskInterface = (params: ClusterCreateTaskInterfaceArgs) => ClusterCreateTask

// Scalar Types
type Transaction = Knex.Transaction
