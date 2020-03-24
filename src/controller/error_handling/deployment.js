
const deploymentStatusUpdater = async (task, error, store) => {
  // create regular expression derived from known errors to match on the actual error 
  const example = new RegExp("I'm an example known error message")

  if (example.test(error)) {
    // if the actual error matches with the known error
    // update or not in a unique way
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

module.exports = deploymentStatusUpdater