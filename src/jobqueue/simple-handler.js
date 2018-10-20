const workers = {
  createCluster: require('./workers/create-kops-cluster'),
  createClusterResume: require('./workers/create-kops-cluster-resume'),
  destroyCluster: require('./workers/destroy-kops-cluster'),
  deploySawtooth: require('./workers/deploy-sawtooth'),
  deploySawtoothResume: require('./workers/deploy-sawtooth-resume'),
  undeploySawtooth: require('./workers/undeploy-sawtooth'),
  undeploySawtoothResume: require('./workers/undeploy-sawtooth-resume'),
}

const SimpleHandler = (store, dispatcher) => (job) => {
  const { name, params } = job
  const worker = workers[name]
  if(!worker) throw new Error(`unknown job type: ${name}`)
  worker(params, store, dispatcher)
}

module.exports = SimpleHandler