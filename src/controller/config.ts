import { API_VERSION, PERMISSION_ACCESS_LEVELS, USER_ACCESS_LEVELS } from '../config'
import { getHelmDeploymentDetails } from '../deployment_templates/templateLoader'
import { browser as clusterFormsBrowser } from '../forms/cluster'
import { browser as userFormsBrowser } from '../forms/user'

export class ConfigBackend {
  /*
    return any values required by the frontend api
    params:
    returns:
      object
        version (string)
  */
  public values() {
    return {
      version: API_VERSION,
      forms: {
        user: userFormsBrowser,
        cluster: clusterFormsBrowser,
        deployment: getHelmDeploymentDetails(),
      },
      userAccessLevels: USER_ACCESS_LEVELS,
      roleAccessLevels: PERMISSION_ACCESS_LEVELS,
    }
  }
}
