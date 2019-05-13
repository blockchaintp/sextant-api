const Promise = require('bluebird')
const async = require('async')
const config = require('../config')
const userUtils = require('../utils/user')
const clusterUtils = require('../utils/cluster')

const deploymentForms = require('../forms/deployment')
const validate = require('../forms/validate')

const {
  CLUSTER_STATUS,
  DEPLOYMENT_STATUS,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ROLE_ACCESS_LEVELS,
  RESOURCE_TYPES,
  DEPLOYMENT_TYPE,
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
      deployment: deployment.id,
    })

    deployment.task = task
    return deployment
  })

  /*
  
    create a new deployment

    params:

     * user - the user that is creating the cluster
     * cluster - the cluster the deployment is for
     * data
       * name
       * deployment_type
       * desired_state
    
    if the user is not an superuser - we create a write role for that
    deployment on this cluster
    
  */
  const create = ({
    user,
    cluster,
    data: {
      name,
      deployment_type,
      deployment_version,
      desired_state,
    }
  }) => store.transaction(async trx => {

    if(!user) throw new Error(`user required for controllers.deployment.create`)
    if(!name) throw new Error(`data.name required for controllers.deployment.create`)
    if(!deployment_type) throw new Error(`data.deployment_type required for controllers.deployment.create`)
    if(!deployment_version) throw new Error(`data.deployment_version required for controllers.deployment.create`)
    if(!desired_state) throw new Error(`data.desired_state required for controllers.deployment.create`)

    if(!DEPLOYMENT_TYPE[deployment_type]) throw new Error(`unknown deployment_type: ${deployment_type}`)

    const schema = deploymentForms[deployment_type].forms[deployment_version]

    if(!schema) throw new Error(`unknown deployment_version: ${deployment_type} version ${deployment_version}`)

    // validate the incoming form data
    await validate({
      schema,
      data: desired_state,
    })

    // create the deployment record
    const deployment = await store.deployment.create({
      data: {
        name,
        cluster,
        deployment_type,
        deployment_version,
        desired_state,
      },
    }, trx)

    // if the user is not a super-user - create a role for the user against the cluster
    if(!userUtils.isSuperuser(user)) {
      await store.role.create({
        data: {
          user: user.id,
          permission: config.PERMISSION_ROLE.write,
          resource_type: config.RESOURCE_TYPES.deployment,
          resource_id: deployment.id,
        },
      }, trx)
    }

    await store.task.create({
      data: {
        user: user.id,
        resource_type: config.RESOURCE_TYPES.deployment,
        resource_id: deployment.id,
        action: config.TASK_ACTION['deployment.create'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return deployment
  })

  /*
  
    get the tasks for a given deployment

    params:

     * id
    
  */
  const getTasks = ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.getTasks`)

    return store.task.list({
      deployment: id,
    })
  }

  return {
    list,
    get,
    create,
    getTasks,
  }

}

module.exports = DeployentController