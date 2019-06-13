// extract a value from the desired_state of a deployment
// based on the paths - this means different deployment
// templates can choose their own fields for name and namespace
// and the deployment templates can get to those values in a
// unified way

const dotty = require('dotty')
const deploymentTypes = require('./index')

const getField = ({
  deployment_type,
  deployment_version,
  data,
  field,
}) => {
  const type = deploymentTypes[deployment_type]
  if(!type) throw new Error(`unknown deployment_type ${deployment_type}`)
  const paths = type.paths[deployment_version]
  if(!paths) throw new Error(`unknown deployment version ${deployment_type} ${deployment_version}`)
  const path = paths[field]
  if(!path) throw new Error(`unknown deployment field ${deployment_type} ${deployment_version} ${field}`)
  return dotty.get(data, path)
}

module.exports = getField