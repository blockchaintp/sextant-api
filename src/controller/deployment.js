const Promise = require('bluebird')
const async = require('async')
const config = require('../config')
const userUtils = require('../utils/user')
const clusterUtils = require('../utils/cluster')

const clusterForms = require('../forms/cluster')
const validate = require('../forms/validate')

const {
  CLUSTER_STATUS,
  DEPLOYMENT_STATUS,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ROLE_ACCESS_LEVELS,
  RESOURCE_TYPES,
} = config

const DeployentController = ({ store, settings }) => {
  
  /*
  
    list deployments

    params:

     * user - the user that is viewing the list
     * deleted - include deleted clusters in the list
     * cluster - the cluster to list the deployments for

    if the is an superuser role - then load all deployments

    otherwise, load deployments that have at least a read role for the
    given user

  */
  const list = async ({
    user,
    cluster,
    deleted,
    withTasks,
  }) => {
    if(!user) throw new Error(`user required for controllers.deployment.list`)
    if(!cluster) throw new Error(`cluster required for controllers.deployment.list`)

    const deployments = await store.deployment.list({
      cluster,
      deleted,
    })

    // if it's a superuser - they can see all clusters
    if(userUtils.isSuperuser(user)) {
      if(withTasks) {
        return loadMostRecentTasksForDeployments({
          deployments,
        })
      }
      else {
        return deployments
      }
    }

    // we need to load the roles that are for a cluster for the user
    const roles = await store.role.listForUser({
      user: user.id,
    })

    const roleMap = roles
      .filter(role => role.resource_type == RESOURCE_TYPES.deployment)
      .reduce((all, role) => {
        all[role.resource_id] = role
        return all
      }, {})

    const filteredDeployments = deployments.filter(deployment => {
      const deploymentRole = roleMap[deployment.id]
      if(!deploymentRole) return false
      return PERMISSION_ROLE_ACCESS_LEVELS[deploymentRole.permission] >= PERMISSION_ROLE_ACCESS_LEVELS.read
    })

    if(withTasks) {
      return loadMostRecentTasksForDeployments({
        deployments: filteredDeployments,
      })
    }
    else {
      return filteredDeployments
    }    
  }

  /*
  
    get a deployment

    params:

     * id
     * withTask - should we load the latest task into the result
    
  */
  const get = async ({
    id,
    withTask,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.get`)

    const deployment = await store.deployment.get({
      id,
    })

    if(!deployment) return null

    if(withTask) {
      const task = await store.task.mostRecentForResource({
        deployment: id,
      })
  
      deployment.task = task
    }

    return deployment
  }

  /*
  
    load the most recent task for each cluster so the frontend can display
    the task status of clusters in the table

    params:

     * clusters
    
  */
  const loadMostRecentTasksForDeployments = ({
    deployments,
  }) => Promise.map(deployments, async deployment => {
    const task = await store.task.mostRecentForResource({
      deployment: deployments.id,
    })

    deployment.task = task
    return deployment
  })

  return {
    list,
    get,
  }

}

module.exports = DeployentController