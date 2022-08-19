const { readdir } = require('promise-fs')
const path = require('path')
const Logging = require('../logging')

const logger = Logging.getLogger({
  name: 'deployment_templates/helmRender',
})

/*

  for a template type and version - return the folder
  in which the helm charts live

*/
const getChartsFolder = ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) =>
  path.resolve(__dirname, deploymentType, deploymentVersion, 'charts')

// get all of the files in the helm charts directory

const getCharts = async ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) => {
  try {
    const chartsFolder = getChartsFolder({
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
    })
    const files = await readdir(chartsFolder)
    return files
  } catch (err) {
    logger.warn(err)
  }
  return []
}

module.exports = {
  getChartsFolder,
  getCharts,
}
