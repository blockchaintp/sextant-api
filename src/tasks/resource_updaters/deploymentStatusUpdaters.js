// when a task errors  - use these functions to update the corresponding resource status in the database
// when a task completes - the corresponding resource updater is currently defined and executed in the taskprocessor

/*
create regular expression derived from known errors to match on the actual error
the following example could be used in place of the expression1 constant
const example = new RegExp("I'm an example known error message")
const expression1 = example.test(error)
multiple expressions could be tested in the conditional statment below
*/

const deploymentCreateError = async (task, error, store) => {
  const expression1 = null // there are no expected error messages to match with

  if (expression1) {
    // if the actual error matches with the known error
    // update or not in a unique way
  } else {
    // update the resource with the resource_status value by default
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

const deploymentUpdateError = async (task, error, store) => {
  const expression1 = null // there are no expected error messages to match with

  if (expression1) {
    // if the actual error matches with the known error
    // update or not in a unique way
  } else {
    // update the resource with the resource_status value by default
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

const deploymentDeleteError = async (task, error, store) => {
  const expression1 = null // there are no expected error messages to match with

  if (expression1) {
    // if the actual error matches with the known error
    // update or not in a unique way
  } else {
    // update the resource with the resource_status value by default
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
  deploymentUpdateError
}
