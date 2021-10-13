const logger = require('../logging').getLogger({
  name: 'jobs/deploymentCounter',
})

const deploymentCounter = async (store) => {
  // checks the DB for active deployments and returns the number
  const activeDeployments = await store.deployment.listActive()
  if (!activeDeployments) return []
  const deploymentNames = activeDeployments.map((deployment) => deployment.name)
  logger.info({
    output: deploymentNames,
    count: deploymentNames.length,
  })
  return activeDeployments
}

module.exports = deploymentCounter
