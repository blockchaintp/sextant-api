const async = require('async')

// save the desired_state to applied_state
// this should be the last step of a task
// such that is there is an error - this won't happen

const SaveAppliedState = ({
  id,
  store,
  transaction,
}, done) => {

  async.waterfall([
    (next) => store.cluster.get({
      id,
      transaction,
    }, next),
    (cluster, next) => store.cluster.update({
      id,
      data: {
        applied_state: cluster.desired_state,
      },
      transaction,
    }, next)
  ], done)
  
}

module.exports = SaveAppliedState