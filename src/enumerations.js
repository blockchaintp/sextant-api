const config = require('./config')

// turn an object of keys into an array of the values
const getEnumeration = (configMap) => Object.values(configMap)

module.exports = {
  RESOURCE_TYPES: getEnumeration(config.RESOURCE_TYPES),
  CLUSTER_PROVISION_TYPE: getEnumeration(config.CLUSTER_PROVISION_TYPE),
  CLUSTER_STATUS: getEnumeration(config.CLUSTER_STATUS),
  DEPLOYMENT_STATUS: getEnumeration(config.DEPLOYMENT_STATUS),
  TASK_STATUS: getEnumeration(config.TASK_STATUS),
  TASK_ACTION: getEnumeration(config.TASK_ACTION),
  PERMISSION_USER: getEnumeration(config.PERMISSION_USER),
  PERMISSION_ROLE: getEnumeration(config.PERMISSION_ROLE),
}