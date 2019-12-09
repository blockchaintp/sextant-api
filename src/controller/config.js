const config = require('../config')
const packageJSON = require('../../package.json')

const userForms = require('../forms/user')
const clusterForms = require('../forms/cluster')
const deploymentForms = require('../forms/deployment')

const forms = {
  user: userForms.browser,
  cluster: clusterForms.browser,
  deployment: deploymentForms,
}

const ConfigBackend = () => {

  /*
  
    return any values required by the frontend api

    params:

    returns:

      object
        version (string)

  */
  const values = () => {
    return {
      version: packageJSON.version,
      forms,
      userAccessLevels: config.USER_ACCESS_LEVELS,
      roleAccessLevels: config.PERMISSION_ACCESS_LEVELS,
    }
  }

  return {
    values,
  }

}

module.exports = ConfigBackend