const logger = require('../logging').getLogger({
  name: __filename,
})
const {
  getAllDeployments,
  getHelmStatuses,
} = require('./pollUtils')

const deploymentStatusPoll = async (store) => {
  // get a list of all of the deployments in the database
  logger.debug({
    fn: 'deploymentStatusPoll',
    message: 'begin',
  })
  const deployments = await getAllDeployments(store)
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
    fn: 'deploymentStatusPoll',
    message: 'end',
  })
}

module.exports = deploymentStatusPoll
