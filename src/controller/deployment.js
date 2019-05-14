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

    // check there is no cluster already with that name
    const deployments = await store.deployment.list({
      cluster,
    })
    const existingDeployment = deployments.find(deployment => deployment.name.toLowerCase() == name.toLowerCase())
    if(existingDeployment) throw new Error(`there is already a deployment with the name ${name}`)

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

    const task = await store.task.create({
      data: {
        user: user.id,
        resource_type: config.RESOURCE_TYPES.deployment,
        resource_id: deployment.id,
        action: config.TASK_ACTION['deployment.create'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return task
  })

  /*
  
    update a deployment

    params:

      * id
      * user - the user that is updating the deployment
      * data
        * name
        * desired_state
        * maintenance_flag
    
  */
  const update = ({
    id,
    user,
    data,
  }) => store.transaction(async trx => {

    if(!id) throw new Error(`id must be given to controller.deployment.update`)
    if(!user) throw new Error(`user must be given to controller.deployment.update`)
    if(!data) throw new Error(`data must be given to controller.deployment.update`)

    // check to see if there are active tasks for this cluster
    const activeTasks = await store.task.activeForResource({
      deployment: id,
    }, trx)

    if(activeTasks.length > 0) throw new Error(`there are active tasks for this deployment`)

    // get the existing cluster
    const deployment = await store.deployment.get({
      id,
    }, trx)

    if(!deployment) throw new Error(`no deployment with that id found: ${id}`)

    const schema = deploymentForms[deployment.deployment_type].forms[deployment.deployment_version]

    // validate the form data
    await validate({
      schema,
      data: data.desired_state,
    })

    // save the deployment
    await store.deployment.update({
      id,
      data,
    }, trx)

    const task = await store.task.create({
      data: {
        user: user.id,
        resource_type: config.RESOURCE_TYPES.deployment,
        resource_id: deployment.id,
        action: config.TASK_ACTION['deployment.update'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return task
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


  /*
  
    delete a deployment

    params:

     * user - the user that is deleting the deployment  
     * id
    
  */
  const del = ({
    user,
    id,
  }) => store.transaction(async trx => {

    if(!user) throw new Error(`user required for controllers.deployment.delete`)
    if(!id) throw new Error(`id must be given to controller.deployment.delete`) 

    // check there are no active tasks for this cluster
    const activeTasks = await store.task.activeForResource({
      deployment: id,
    }, trx)

    if(activeTasks.length > 0) throw new Error(`there are active tasks for this deployment`)

    // create a delete task
    const task = await store.task.create({
      data: {
        user: user.id,
        resource_type: config.RESOURCE_TYPES.deployment,
        resource_id: id,
        action: config.TASK_ACTION['deployment.delete'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return task
  })


  /*
  
    delete a deployment - i.e. actually delete it from disk
    a deployment *must* be in the `deleted` state to do this

    params:

     * user - the user that is deleting the deployment  
     * id
    
  */
  const deletePermenantly = ({
    user,
    id,
  }) => store.transaction(async trx => {

    if(!user) throw new Error(`user required for controllers.deployment.delete`)
    if(!id) throw new Error(`id must be given to controller.deployment.delete`) 

    // check there are no active tasks for this cluster
    const activeTasks = await store.task.activeForResource({
      deployment: id,
    }, trx)

    if(activeTasks.length > 0) throw new Error(`there are active tasks for this deployment`)

    const deployment = await store.deployment.get({
      id,
    }, trx)

    if(deployment.status != DEPLOYMENT_STATUS.deleted) throw new Error(`a deployment must be in deleted status to be deleted permenantly`)

    // delete the cluster tasks, roles and then the cluster
    await store.task.deleteForResource({
      resource_type: 'deployment',
      resource_id: deployment.id,
    }, trx)
    await store.role.deleteForResource({
      resource_type: 'deployment',
      resource_id: deployment.id,
    }, trx)
    await store.deployment.delete({
      id: deployment.id,
    }, trx)

    return true
  })

  /*
  
    get a collectin of kubernetes resources for this deployment

     * pods
     * services
     * persistent volumes

    params:

     * id - the deployment id
  
  */
  const resources = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.delete`) 

    const deployment = await store.deployment.get({
      id,
    })

    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })

    return {
      pods: [],
      services: [],
      volumes: [],
    }

  }

  return {
    list,
    get,
    create,
    update,
    getTasks,
    delete: del,
    deletePermenantly,
    resources,
  }

}

module.exports = DeployentController