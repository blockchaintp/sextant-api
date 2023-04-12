/* eslint-disable brace-style */
/*
when a task errors -
use these functions to update the corresponding resource status in the database.
When a task completes -
the corresponding resource updater is currently defined and executed in the taskprocessor
*/

/*
**** HOW TO ADD ERROR MATCHING ****
create a regular expression derived from known errors to match on the actual error
the following is an example of how to modify the updater function with a conditional statement

const example = new RegExp("I'm an example known error message")
const expression1 = example.test(error) ----> returns true if a match is found

multiple expressions could be tested in the conditional statment below

if (expression1) {
    // if the actual error matches with the known error
    // update or not in a unique way here
  } else {
    // update the resource with the resource_status value by default
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
*/
import { getLogger } from '../../logging'
import { DeploymentStore } from '../../store/deployment'
import * as model from '../../store/model/model-types'

const logger = getLogger({
  name: 'tasks/resource_updaters/deploymentStatusUpdaters',
})

const errorTest = (error: string, knownError: string) => {
  const example = new RegExp(knownError)
  return example.test(error)
}

const completeTask = async (task: model.Task, store: DeploymentStore) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.completed,
      updated_at: new Date(),
    },
  })
}

export const deploymentCreateError = async (task: model.Task, store: DeploymentStore) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
      updated_at: new Date(),
    },
  })
}

export const deploymentUpdateError = async (task: model.Task, store: DeploymentStore) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
      updated_at: new Date(),
    },
  })
}

export const deploymentDeleteError = async (task: model.Task, store: DeploymentStore, error: string) => {
  if (errorTest(error, 'Unable to connect to the server')) {
    try {
      await completeTask(task, store)
      logger.info({
        error,
        info: 'Unable to connect to the server: deleteTask updated to "completed"',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: 'unable to connect to the server or update task status',
      })
    }
  } else if (errorTest(error, 'Kubernetes cluster unreachable')) {
    try {
      await completeTask(task, store)
      logger.info({
        error,
        info: 'Kubernetes cluster unreachable, deleteTask updated to "completed"',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: 'Kubernetes cluster unreachable and unable to update task status',
      })
    }
  } else if (errorTest(error, 'unable to recognize')) {
    try {
      await completeTask(task, store)
      logger.info({
        error,
        info: 'unable to recognize and deleteTask updated to "completed"',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: 'Unable to recognize and unable to update task status',
      })
    }
  } else if (errorTest(error, 'unknown deployment version')) {
    try {
      await completeTask(task, store)
      logger.info({
        error,
        info: 'unknown deployment version - deleteTask updated to "completed"',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: 'Unknown deployment version - unable to update task status',
      })
    }
  } else if (errorTest(error, 'Release not loaded') || errorTest(error, 'not found')) {
    try {
      await completeTask(task, store)
      logger.info({
        error,
        info: 'The helm chart has likely been uninstalled via the command line - deleteTask updated to "completed"',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: '"Error: release not loaded" or "Error: release: not found" - unable to update task status',
      })
    }
  } else {
    // do not complete the task
    try {
      await store.update({
        id: task.resource_id,
        data: {
          status: task.resource_status.error,
          updated_at: new Date(),
        },
      })
      logger.info({
        error,
        info: 'Could not complete the delete task - task status updated to "error" ',
      })
    } catch (e: unknown) {
      logger.error({
        error: e,
        info: 'Delete task has likely errored, but the task status could not be updated to "error"',
      })
    }
  }
}

export default {
  deploymentCreateError,
  deploymentDeleteError,
  deploymentUpdateError,
}
