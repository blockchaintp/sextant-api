const workers = {
  createCluster: require('./workers/create-kops-cluster'),
  waitClusterCreated: require('./workers/wait-cluster-created'),
  exportClusterConfigFiles: require('./workers/export-cluster-config-files'),
}

const SimpleHandler = (store, dispatcher) => (job) => {
  const { name, params } = job
  const worker = workers[name]
  if(!worker) throw new Error(`unknown job type: ${name}`)
  worker(params, store, dispatcher)
}

module.exports = SimpleHandler