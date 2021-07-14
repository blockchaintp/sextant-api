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
const pinoDeploymentDelete = require('pino')({
  action: 'delete or undeploy a deployment',
  name: 'deployment status updator',
  result: 'The deployment status WILL UPDATE to the deleted (undeployed) state in the database',
})

const errorTest = (error, knownError) => {
  const example = new RegExp(knownError)
  return example.test(error)
}

const completeTask = async (task, error, store) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.completed,
    },
  })
}

const deploymentCreateError = async (task, error, store) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
    },
  })
}

const deploymentUpdateError = async (task, error, store) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
    },
  })
}

const deploymentDeleteError = async (task, error, store) => {
  if (errorTest(error, 'Unable to connect to the server')) {
    completeTask(task, error, store)
    pinoDeploymentDelete.info({
      error,
      info: 'The remote cluster is likely dead and cannot be reached',
    })
  }
  else if (errorTest(error, 'Kubernetes cluster unreachable')) {
    completeTask(task, error, store)
    pinoDeploymentDelete.info({
      error,
      info: 'The kubernetes cluster is likely dead and cannot be reached',
    })
  }
  else if (errorTest(error, 'unable to recognize')) {
    completeTask(task, error, store)
    pinoDeploymentDelete.info({
      error,
      info: 'The kubernetes cluster cannot be reached',
    })
  }
  else if (errorTest(error, 'unknown deployment version')) {
    completeTask(task, error, store)
    pinoDeploymentDelete.info({
      error,
      info: 'The name of the helm chart has likely been changed',
    })
  }
  else if (errorTest(error, 'Release not loaded') || errorTest(error, 'not found')) {
    completeTask(task, error, store)
    pinoDeploymentDelete.info({
      error,
      info: 'The helm chart has likely been uninstalled via the command line',
    })
  }
  else {
    // do not complete the task
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

module.exports = {
  deploymentCreateError,
  deploymentDeleteError,
  deploymentUpdateError,
}
