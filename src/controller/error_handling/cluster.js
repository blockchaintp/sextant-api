const clusterStatusUpdater= async (task, error, store) => {
  // create regular expression to match on the actual error derived from known errors
  const test = new RegExp("I'm a test error message")

  if (error.match(test)[0] === "I'm a test error message") {
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

module.exports = clusterStatusUpdater