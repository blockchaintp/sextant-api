import { TASK_STATUS, RESOURCE_TYPES } from '../config'
import * as updaters from '../tasks/resource_updaters/index'
import { getLogger } from '../logging'
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import * as model from '../store/model/model-types'
import { Knex } from 'knex'
import { DeploymentStore } from '../store/deployment'
import { ClusterStore } from '../store/cluster'
import { TaskStore } from '../store/task'
import { Task } from './task'

const logger = getLogger({
  name: 'taskprocessor',
})

const resourceUpdaters = updaters as {
  [key: string]: (task: model.Task, store: ResourceStore, error?: Error) => Promise<object>
}

type TaskHandler = ({ testMode }: { testMode: boolean }) => (params: any) => GeneratorFunction
type Handlers = {
  [key: string]: TaskHandler
}

type ResourceStore = ClusterStore | DeploymentStore | TaskStore
export class RefactoredTaskProcessor {
  private knex: Knex
  store: Store
  handlers: Handlers
  logging: boolean
  controlLoopRunning: boolean
  stopped: boolean
  resourceTypeStores: {
    [key: string]: ResourceStore
  }

  constructor(knex: Knex, store: Store, handlers: Handlers, logging: boolean) {
    this.knex = knex
    this.store = store
    this.handlers = handlers
    this.logging = logging
    this.controlLoopRunning = false
    this.stopped = false
    this.resourceTypeStores = {
      [RESOURCE_TYPES.cluster]: this.store.cluster,
      [RESOURCE_TYPES.deployment]: this.store.deployment,
    }
  }

  getStoreForResourceType(task: model.Task) {
    return this.resourceTypeStores[task.resource_type]
  }

  async loadTaskStatus(id: DatabaseIdentifier): Promise<string> {
    logger.debug(`loadTaskStatus: ${id}`)
    const status: string = await this.store.task
      .get({
        id,
      })
      .then((task) => task.status)
    return status
  }

  async loadTasksWithStatus(status: string) {
    logger.debug(`loadTasksWithStatus: ${status}`)
    await this.store.task.list({
      status,
    })
  }

  async loadRunningTasks() {
    logger.debug(`loadRunningTasks`)
    await this.loadTasksWithStatus(TASK_STATUS.running)
  }

  async loadCreatedTasks() {
    logger.debug(`loadCreatedTasks`)
    await this.loadTasksWithStatus(TASK_STATUS.created)
  }
  // we should remove cancelled as a concept
  async isTaskCancelled(task: model.Task) {
    logger.debug(`isTaskCancelled: ${task.id}`)
    const status = await this.loadTaskStatus(task.id)
    return status === TASK_STATUS.cancelling
  }

  async updateTaskStatus(task: model.Task, status: string, timestamps: { started?: boolean; ended?: boolean }) {
    logger.debug(`updateTaskStatus: ${task.id} ${status}`)

    const updateData: {
      status: string
      started_at?: Date
      ended_at?: Date
    } = {
      status,
    }

    if (timestamps.started) {
      updateData.started_at = new Date(Date.now())
    }

    if (timestamps.ended) {
      updateData.ended_at = new Date(Date.now())
    }

    await this.store.task.update({
      id: task.id,
      data: updateData,
    })
  }

  async errorTask(task: model.Task, error: Error) {
    if (this.logging) {
      logger.error({
        action: 'error',
        error: error.toString(),
        stack: error.stack,
        task,
      })
    }

    await this.store.task.update({
      id: task.id,
      data: {
        status: TASK_STATUS.error,
        ended_at: new Date(Date.now()),
        error: error.toString().substring(0, 250),
      },
    })

    const resourceTypeStore = this.resourceTypeStores[task.resource_type]

    const resourceUpdater = resourceUpdaters[task.action] || resourceUpdaters.default

    await resourceUpdater(task, resourceTypeStore, error)
  }

  // we should remove cancelled as a concept
  async completeTask(task: model.Task, trx: Knex.Transaction, cancelled: boolean) {
    const finalTaskStatus = cancelled ? TASK_STATUS.cancelled : TASK_STATUS.finished

    await this.updateTaskStatus(task, finalTaskStatus, { ended: true })

    if (!cancelled) {
      // get a reference to the store handler for the task resource
      const resourceTypeStore = this.resourceTypeStores[task.resource_type]
      if (task.resource_type === 'deployment') {
        await resourceTypeStore.update(
          {
            id: task.resource_id,
            data: {
              status: task.resource_status.completed,
              updated_at: new Date(),
            },
          },
          trx
        )
      }
      await resourceTypeStore.update(
        {
          id: task.resource_id,
          data: {
            status: task.resource_status.completed,
          },
        },
        trx
      )
    }
  }

  // this method definition will shift as the refactor removes generators/yield statements
  async runTask(task: model.Task) {
    await this.store.transaction(async (trx) => {
      // check that we have a handler for the task
      const handler = this.handlers[task.action]

      if (!handler) {
        throw new Error(`no handler was found for task: ${task.action}`)
      }

      // update the task be to in running state
      const runningTask = await this.updateTaskStatus(task, TASK_STATUS.running, { started: true })

      const runner = Task({
        generator: handler, // this type will get resolved as the refactor progresses
        params: {
          store: this.store,
          trx,
          task: runningTask,
          logging: this.logging,
        },
        onStep: async () => {
          const isCancelled = await Promise.resolve(isTaskCancelled(runningTask))
          if (isCancelled) runner.cancel()
        },
      })
    })
    // ..... more code to follow
  }
  /*

    the remaining methods are tightly woven with the generator/yield statements pattern
    at this point I'm going to pause building out the TaskProsessor class
    and transition to refactoring `task.ts` to run without generators/yield statements

  */
}
