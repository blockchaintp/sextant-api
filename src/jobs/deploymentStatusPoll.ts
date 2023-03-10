import { getLogger } from '../logging'
import { Store } from '../store'
import { getAllDeployments, getHelmStatuses } from './pollUtils'
const logger = getLogger({
  name: 'jobs/deploymentStatusPoll',
})

export const deploymentStatusPoll = async (store: Store) => {
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
    fn: 'deploymentStatusPoll',
    message: 'end',
    deploymentStatuses,
  })
}
