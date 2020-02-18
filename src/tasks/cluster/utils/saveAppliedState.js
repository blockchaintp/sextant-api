/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// save the desired_state to applied_state
// this should be the last step of a task
const SaveAppliedState = async ({
  id,
  store,
  trx,
}) => {

  const cluster = await store.cluster.get({
    id,
  }, trx)

  return store.cluster.update({
    id,
    data: {
      applied_state: cluster.desired_state,
    },
  }, trx)
}

module.exports = SaveAppliedState
