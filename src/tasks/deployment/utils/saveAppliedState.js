// save the desired_state to applied_state
// this should be the last step of a task
const SaveAppliedState = async ({
  id,
  store,
  trx,
}) => {

  const deployment = await store.deployment.get({
    id,
  }, trx)

  return store.deployment.update({
    id,
    data: {
      applied_state: deployment.desired_state,
    },
  }, trx)  
}

module.exports = SaveAppliedState