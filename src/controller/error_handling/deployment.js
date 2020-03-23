const deploymentStuatusUpdater = async (task, error, store) => {
  // regex matching on error
  const test = new RegExp("I'm a test error message")

  if (error.match(test)[0] === "I'm a test error message") {
    // do this stuff - update or not update in a unique way
  } else {
    // update the resource with the resource_status by default
    await store.update({
      id: task.resource_id,
      data: {
        status: task.resource_status.error,
      },
    })
  }
}

module.exports = deploymentStuatusUpdater