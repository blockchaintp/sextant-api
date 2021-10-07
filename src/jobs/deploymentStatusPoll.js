const logger = require('../logging').getLogger({
  name: 'jobs',
  job: 'Deployment Status Poll',
})
const {
  getDeployments,
  getHelmStatuses,
} = require('./pollUtils')

const deploymentStatusPoll = async (store) => {
  // get a list of all of the deployments in the database
  logger.info({
    action: 'running the deployment status poll',
    time: new Date(),
  })
  const deployments = await getDeployments(store)
  // for each deployment, get the helm status and check to see if the deployment status needs to be updated
  // if it does - update it in the DB
  const deploymentStatuses = await getHelmStatuses(deployments, store)
  logger.info({
    deploymentStatuses: deploymentStatuses.map((deployment) => {
      const helmResponse = deployment.helm_response
      return {
        name: helmResponse.name,
        namespace: helmResponse.namespace,
        helmStatus: helmResponse.status,
        sextantStatus: deployment.status,
      }
    }),
  })
  logger.info({
    action: 'exiting the poll',
    time: new Date(),
  })
}

module.exports = deploymentStatusPoll
