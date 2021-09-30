// call this function in the src/index.js
// schedule.scheduleJob('* */5 * * * *', () => { deploymentMeter(store) })

const {
  getDeployments,
  getHelmStatuses,
} = require('./meterUtils')

const deploymentMeter = async (store) => {
  // get a list of all of the deployments in the database
  const deployments = await getDeployments(store)
  // for each deployment, get the helm status and check to see if the deployment status needs to be updated
  // if it does - update it in the DB
  await getHelmStatuses(deployments, store)
}

module.exports = deploymentMeter
