const Promise = require('bluebird')
const async = require('async')
const config = require('../config')
const userUtils = require('../utils/user')
const clusterUtils = require('../utils/cluster')

const clusterForms = require('../forms/cluster')
const validate = require('../forms/validate')

const {
  CLUSTER_STATUS,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ROLE_ACCESS_LEVELS,
} = config

const ClusterController = ({ store, settings }) => {
  
  /*
  
    list clusters

    params:

     * user - the user that is viewing the list
     * deleted - include deleted clusters in the list

    if the is an superuser role - then load all clusters

    otherwise, load clusters that have at least a read role for the
    given user

  */
  const list = async ({
    user,
    deleted,
  }) => {
    if(!user) throw new Error(`user required for controllers.cluster.list`)

    const clusters = await store.cluster.list({
      deleted,
    })
    
    // if it's a superuser - they can see all clusters
    if(userUtils.isSuperuser(user)) {
      return loadMostRecentTasksForClusters({
        clusters,
      })
    }

    // we need to load the roles that are for a cluster for the user
    const roles = await store.role.listForUser({
      user: user.id,
    })

    const roleMap = roles
      .filter(role => role.resource_type == config.RESOURCE_TYPES.cluster)
      .reduce((all, role) => {
        all[role.resource_id] = role
        return all
      }, {})

    clusters = clusters.filter(cluster => {
      const clusterRole = roleMap[cluster.id]
      if(!clusterRole) return false
      return PERMISSION_ROLE_ACCESS_LEVELS[clusterRole.permission] >= PERMISSION_ROLE_ACCESS_LEVELS.read
    })

    return loadMostRecentTasksForClusters({
      clusters,
    })
  }

  /*
  
    get a cluster

    params:

     * id
    
  */
  const get = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.cluster.update`)

    const cluster = await store.cluster.get({
      id,
    })

    const task = await store.task.mostRecentForResource({
      cluster: id,
    })

    cluster.task = task

    return cluster
  }

  /*
  
    load the most recent task for each cluster so the frontend can display
    the task status of clusters in the table

    params:

     * clusters
    
  */
  const loadMostRecentTasksForClusters = ({
    clusters,
  }) => Promise.map(clusters, async cluster => {
    const task = await store.task.mostRecentForResource({
      cluster: cluster.id,
    })

    cluster.task = task
    return cluster
  })
    

  

  /*
  
    insert the cluster secrets into the store
    and update the cluster desired_state to point at their ids

    params:

     * cluster
     * desired_state
     * secrets
  
  */
  const createClusterSecrets = async ({
    cluster,
    desired_state,
    secrets,
  }, trx) => {

    const createdSecrets = {}

    if(secrets.token) {
      createdSecrets.token = await store.clustersecret.create({
        data: {
          cluster: cluster.id,
          name: 'token',
          base64Data: secrets.token.base64Data,
        },
      }, trx)
    }

    if(secrets.ca) {
      createdSecrets.ca = await store.clustersecret.create({
        data: {
          cluster: cluster.id,
          name: 'ca',
          base64Data: secrets.ca.base64Data,
        },
      }, trx)
    }

    const {
      applied_state,
    } = cluster

    const updatedDesiredState = Object.assign({}, desired_state)

    if(createdSecrets.token) {
      updatedDesiredState.token_id = createdSecrets.token.id
    }
    else if(applied_state && applied_state.token_id) {
      updatedDesiredState.token_id = applied_state.token_id
    }

    if(createdSecrets.ca) {
      updatedDesiredState.ca_id = createdSecrets.ca.id
    }
    else if(applied_state && applied_state.ca_id) {
      updatedDesiredState.ca_id = applied_state.ca_id
    }

    return updatedDesiredState
  }

  /*
  
    create a new cluster

    params:

     * user - the user that is creating the cluster
     * data
       * name
       * provision_type
       * desired_state
       * capabilities
    
    if the user is not an superuser - we create a write role for that
    user on this cluster
    
  */
  const create = ({
    user,
    data: {
      name,
      provision_type,
      desired_state,
      capabilities,
    }
  }) => store.transaction(async trx => {

    if(!user) throw new Error(`user required for controllers.cluster.create`)
    if(!name) throw new Error(`data.name required for controllers.cluster.create`)
    if(!provision_type) throw new Error(`data.provision_type required for controllers.cluster.create`)
    if(!desired_state) throw new Error(`data.desired_state required for controllers.cluster.create`)

    if(!CLUSTER_PROVISION_TYPE[provision_type]) throw new Error(`unknown provision_type: ${provision_type}`)

    const extractedSecrets = clusterUtils.extractClusterSecrets({
      desired_state,
    })


    // validate the incoming form data
    await validate({
      schema: clusterForms.server[provision_type].add,
      data: {
        name,
        provision_type,
        desired_state,
        capabilities,
      },
    })

    // check there is no cluster already with that name
    const clusters = await store.cluster.list({})
    const existingCluster = clusters.find(cluster => cluster.name.toLowerCase() == name.toLowerCase())
    if(existingCluster) throw new Error(`there is already a cluster with the name ${name}`)

    // create the cluster record
    const cluster = await store.cluster.create({
      data: {
        name,
        provision_type,
        capabilities,
        desired_state: {},
      },
    }, trx)

    // insert the cluster secrets for that cluster
    const updatedDesiredState = await createClusterSecrets({
      cluster,
      secrets: extractedSecrets.secrets,
      desired_state: extractedSecrets.desired_state,
    }, trx)

    // update the cluster desired state with pointers to the secrets
    const updatedCluster = await store.cluster.update({
      id: cluster.id,
      data: {
        desired_state: updatedDesiredState,
      },
    }, trx)

    // if the user is not a super-user - create a role for the user against the cluster
    if(!userUtils.isSuperuser(user)) {
      await store.role.create({
        data: {
          user: user.id,
          permission: config.PERMISSION_ROLE.write,
          resource_type: config.RESOURCE_TYPES.cluster,
          resource_id: cluster.id,
        },
      }, trx)
    }

    await store.task.create({
      data: {
        user: user.id,
        resource_type: config.RESOURCE_TYPES.cluster,
        resource_id: cluster.id,
        action: config.TASK_ACTION['cluster.create'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return updatedCluster
  })

  /*
  
    update a cluster

    params:

      * id
      * user - the user that is updating the cluster
      * data
        * name
        * provision_type
        * desired_state
        * maintenance_flag
    
  */
  const update = ({
    id,
    user,
    data,
  }) => store.transaction(async trx => {

    if(!id) throw new Error(`id must be given to controller.cluster.update`)
    if(!user) throw new Error(`user must be given to controller.cluster.update`)
    if(!data) throw new Error(`data must be given to controller.cluster.update`)

    // extract the fields that are actually given in the payload
    const formData = ([
      'name',
      'provision_type',
      'desired_state',
      'maintenance_flag',
    ]).reduce((all, field) => {
      if(data[field]) all[field] = data[field]
      return all
    }, {})

    // extract the secrets from the form data
    const extractedSecrets = clusterUtils.extractClusterSecrets({
      desired_state: formData.desired_state,
    })

    // inject the processed desired state into the submission data
    if(formData.desired_state) {
      formData.desired_state = extractedSecrets.desired_state
    }

    // check to see if there are active tasks for this cluster
    const activeTasks = await store.task.activeForResource({
      cluster: id,
    }, trx)

    if(activeTasks.length > 0) throw new Error(`there are active tasks for this cluster`)

    // get the existing cluster
    const cluster = await store.cluster.get({
      id,
    }, trx)

    if(!cluster) throw new Error(`no cluster with that id found: ${id}`)

    // validate the form data
    await validate({
      schema: clusterForms.server[cluster.provision_type].edit,
      data: formData,
    })

    // insert the new secrets into the database
    const updatedDesiredState = await createClusterSecrets({
      cluster,
      desired_state: formData.desired_state,
      secrets: extractedSecrets.secrets,
    }, trx)

    formData.desired_state = updatedDesiredState

    // save the cluster
    const updatedCluster = await store.cluster.update({
      id,
      data: formData,
    }, trx)

    // if there is an update to the desired state
    // trigger a task to update it
    if(data.desired_state) {
      await store.task.create({
        data: {
          user: user.id,
          resource_type: config.RESOURCE_TYPES.cluster,
          resource_id: cluster.id,
          action: config.TASK_ACTION['cluster.update'],
          restartable: true,
          payload: {},
        },
      }, trx)
    }

    return updatedCluster
  })

  /*
  
    delete a cluster

    params:

     * user - the user that is creating the cluster  
     * id
    
  */
  const del = ({
    user,
    id,
  }) => store.transaction(async trx => {

    if(!user) throw new Error(`user required for controllers.cluster.delete`)
    if(!id) throw new Error(`id must be given to controller.cluster.delete`) 

    // check there are no active tasks for this cluster
    const activeTasks = await store.task.activeForResource({
      cluster: id,
    })

    if(activeTasks.length > 0) throw new Error(`there are active tasks for this cluster`)

    // create a delete task
    store.task.create({
      data: {
        user: params.user.id,
        resource_type: config.RESOURCE_TYPES.cluster,
        resource_id: id,
        action: config.TASK_ACTION['cluster.delete'],
        restartable: true,
        payload: {},
      },
    }, trx)

    return true
  })

  /*
  
    get the roles for a given cluster

    params:

     * id
    
  */
  const getRoles = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.cluster.getRoles`)

    const roles = await store.role.listForResource({
      resource_type: 'cluster',
      resource_id: id,
    })

    return Promise.map(roles, async role => {
      const user = await store.user.get({
        id: role.user,
      })
      role.userRecord = userUtils.safe(user)
      return role
    })
  }

  /*
  
    create a role for a given cluster

    params:

     * id
     * user
     * permission
    
  */
  const createRole = ({
    id,
    user,
    permission,
  }) => store.transaction(trx => {
    if(!id) throw new Error(`id must be given to controller.cluster.createRole`)
    if(!user) throw new Error(`user must be given to controller.cluster.createRole`)
    if(!permission) throw new Error(`permission must be given to controller.cluster.createRole`)

    return store.role.create({
      data: {
        resource_type: 'cluster',
        resource_id: id,
        user,
        permission,
      },
    }, trx)
  })

  /*
  
    delete a role for a given cluster

    params:

     * id
     * user
    
  */
  const deleteRole = ({
    id,
    user,
  }) => store.transaction(async trx => {
    if(!id) throw new Error(`id must be given to controller.cluster.createRole`)
    if(!user) throw new Error(`user must be given to controller.cluster.createRole`)

    const roles = await store.role.listForResource({
      resource_type: 'cluster',
      resource_id: id,
    }, trx)

    const role = roles.find(role => role.user == user)
    if(!role) throw new Error(`no role for user ${user} found for cluster ${id}`)

    return store.role.delete({
      id: role.id,
    }, trx)
  })

  /*
  
    get the tasks for a given cluster

    params:

     * id
    
  */
  const getTasks = ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.cluster.getTasks`)

    return store.task.list({
      cluster: id,
    })
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    getRoles,
    createRole,
    deleteRole,
    getTasks,
  }

}

module.exports = ClusterController