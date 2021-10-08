const logger = require('../logging').getLogger({
  name: 'jobs/deploymentStatusPoll',
})
const {
  getDeployments,
  getHelmStatuses,
} = require('./pollUtils')

const deploymentStatusPoll = async (store) => {
  // get a list of all of the deployments in the database
  logger.info({
    action: 'running the Ddeployment Status Poll',
    time: new Date(),
  })
  const deployments = await getDeployments(store)
  // for each deployment, get the helm status and check to see if the deployment status needs to be updated
  // if it does - update it in the DB
  const deploymentStatuses = await getHelmStatuses(deployments, store)
  logger.info({
    deploymentStatuses: deploymentStatuses.map((deployment) => ({
      name: deployment.name,
      helmStatus: deployment.helmStatus,
      sextantStatus: deployment.status,
    })),
  })
  logger.info({
    action: 'exiting the Deployment Status Poll',
    time: new Date(),
  })
}

module.exports = deploymentStatusPoll
