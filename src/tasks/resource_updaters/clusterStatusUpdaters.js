// when a task errors  - use these functions to update the corresponding resource status in the database
// when a task completes - the corresponding resource updater is currently defined and executed in the taskprocessor

/*
**** HOW TO ADD ERROR MATCHING ****
create a regular expression derived from known errors to match on the actual error
the following is an example of how to modify the updater function with a conditional statement

const example = new RegExp("I'm an example known error message")
const expression1 = example.test(error) ----> returns true if a match is found

multiple expressions could be tested in the conditional statement below

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

const logger = require('../../logging').getLogger({
  name: 'tasks/resource_updaters/clusterStatusUpdaters',
})

const errorTest = (error, knownError) => {
  const example = new RegExp(knownError)
  return example.test(error)
}

const clusterCreateError = async (task, error, store) => {
  await store.update({
    id: task.resource_id,
    data: {
      status: task.resource_status.error,
    },
  })
}

const clusterUpdateError = clusterCreateError

const clusterDeleteError = async (task, error, store) => {
  if (errorTest(error, 'all deployments for this cluster must be in deleted state')) {
    logger.info({
      action: 'Update the cluster status',
      info: 'Unable to delete the cluster while there are active deployments',
      result: 'The cluster status was NOT updated in the database',
    })
  } else {
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

module.exports = {
  clusterCreateError,
  clusterDeleteError,
  clusterUpdateError,
}
