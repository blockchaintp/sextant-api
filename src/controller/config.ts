import * as config from '../config'
import * as userForms from '../forms/user'
import * as clusterForms from '../forms/cluster'
import { getHelmDeploymentDetails } from '../deployment_templates/templateLoader'

const ConfigBackend = () => {
  /*
    return any values required by the frontend api
    params:
    returns:
      object
        version (string)
  */
  const values = () => ({
    version: config.API_VERSION,
    forms: {
      user: userForms.browser,
      cluster: clusterForms.browser,
      deployment: getHelmDeploymentDetails(),
    },
    userAccessLevels: config.USER_ACCESS_LEVELS,
    roleAccessLevels: config.PERMISSION_ACCESS_LEVELS,
  })

  return {
    values,
  }
}

module.exports = ConfigBackend
