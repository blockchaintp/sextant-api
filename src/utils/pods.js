/*

  utility function for the status of pods in a sawtooth network

  used for the deploy and undeploy steps to decide when pods are ready
  
*/

const Pods = (kubectl) => {
  
  /*
  
    check for the status of pods starting up

    returns one of:

     * pending
     * failed
     * running

    if any of the pods are failed - it will return that status
    
  */
  const isDeployed = (done) => {
    kubectl.jsonCommand({
      command: 'get po'
    }, (err, pods) => {
      if(err) return done(err)
      const items = pods.items || []

      if(items.length <= 0) return done(null, 'pending')

      const runningPods = items.filter(item => item.status.phase == 'Running')
      const failedPods = items.filter(item => item.status.phase == 'Failed')

      if(runningPods.length >= items.length) {
        return done(null, 'running')
      }

      if(failedPods.length > 0) {
        return done(null, 'failed')
      }

      return done(null, 'pending')
    })
  }

  /*
  
    check for the status of pods terminating

    returns one of:

     * terminating
     * terminated
    
  */
  const isUndeployed = (done) => {
    kubectl.jsonCommand({
      command: 'get po'
    }, (err, pods) => {
      if(err) return done(err)
      const items = pods.items || []

      if(items.length > 0) {
        return done(null, 'terminating')
      }
      else {
        return done(null, 'terminated')
      }
    })
  }

  return {
    isDeployed,
    isUndeployed,
  }
}

module.exports = Pods