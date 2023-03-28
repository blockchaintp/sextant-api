import { Task } from '../../../store/model/model-types'
import { Store } from '../../../store'
import { Knex } from 'knex'

export type ClusterUpdateTask = Generator<Promise<unknown>, void, unknown>

export type ClusterUpdateTaskParams = {
  store: Store
  task: Task
  trx: Transaction
}

export type ClusterUpdateTaskInterfaceArgs = {
  testMode: boolean
}

export type ClusterUpdateTaskInterface = (params: ClusterUpdateTaskInterfaceArgs) => ClusterUpdateTask

// Scalar Types
type Transaction = Knex.Transaction
