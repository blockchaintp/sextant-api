// extract a value from the desired_state of a deployment
// based on the paths - this means different deployment
// templates can choose their own fields for name and namespace
// and the deployment templates can get to those values in a
// unified way

const dotty = require('dotty')
const deploymentTypes = require('../deployment_templates')
const logger = require('../logging').getLogger({
  name: 'utils/getField',
})

const getField = ({
  deployment_type,
  deployment_version,
  data,
  field,
}) => {
  const type = deploymentTypes[deployment_type]
  if (!type) {
    logger.trace({ deployment_type, deploymentTypes }, 'no deployment type')
    throw new Error(`unknown deployment_type ${deployment_type}`)
  }
  const paths = type.paths[deployment_version]
  if (!paths) {
    logger.trace({ deployment_version, paths: type.paths }, 'no deployment_version')
    throw new Error(`unknown deployment version ${deployment_type} ${deployment_version}`)
  }
  const path = paths[field]
  if (!path) {
    logger.trace({ field, paths }, 'no field')
    throw new Error(`unknown deployment field ${deployment_type} ${deployment_version} ${field}`)
  }
  return dotty.get(data, path)
}

module.exports = getField
