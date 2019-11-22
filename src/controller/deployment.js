const Promise = require('bluebird')
const async = require('async')
const axios = require('axios')
const config = require('../config')
const userUtils = require('../utils/user')
const clusterUtils = require('../utils/cluster')
const ClusterKubectl = require('../utils/clusterKubectl')
const RBAC = require('../rbac')

const deploymentForms = require('../forms/deployment')
const deploymentTemplates = require('../deployment_templates')
const getField = require('../deployment_templates/getField')
const validate = require('../forms/validate')

const Address = require('../utils/address')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const KeyPair = require('../utils/sextantKeyPair')
const KeyManager = require('../api/keyManager')
const DamlRPC = require('../api/damlRPC')
const SettingsTP = require('../api/settingsTP')
const ledger = require('@digitalasset/daml-ledger')

const {
  CLUSTER_STATUS,
  DEPLOYMENT_STATUS,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ACCESS_LEVELS,
  RESOURCE_TYPES,
  DEPLOYMENT_TYPE,
  USER_TYPES,
} = config

const DeployentController = ({ store, settings }) => {
  
  const keyManager = KeyManager({
    store,
  })
  const damlRPC = DamlRPC({
    store,
  })
  const settingsTP = SettingsTP()

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

    const filteredDeployments = await Promise.filter(deployments, async deployment => {
      const canSeeDeployment = await RBAC(store, user, {
        resource_type: 'deployment',
        resource_id: deployment.id,
        method: 'get',
      })
      return canSeeDeployment
    })

    if(withTasks) {
      return loadAdditionalDeploymentData({
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

    also load the cluster and inject the name so a user without RBAC access
    onto the cluster can at least see the cluster name

    params:

     * clusters
    
  */
  const loadAdditionalDeploymentData = ({
    deployments,
  }) => {

    const clusterCache = {}

    const loadClusterForDeployment = async ({
      id
    }) => {
      if(clusterCache[id]) return clusterCache[id]
      const cluster = await store.cluster.get({
        id,
      })
      clusterCache[id] = cluster
      return cluster
    }

    return Promise.map(deployments, async deployment => {
      const task = await store.task.mostRecentForResource({
        deployment: deployment.id,
      })

      const cluster = await loadClusterForDeployment({
        id: deployment.cluster,
      })

      deployment.task = task
      deployment.clusterName = cluster.name
      return deployment
    })
  }

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

    // Check ot make sure there isn't a deployment on the cluster yet
    if (deployments.length > 0) throw new Error("there is already a deployment provisioned for this cluster")
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
          permission: config.PERMISSION_TYPES.write,
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
  
    get the roles for a given deployment

    params:

     * id
    
  */
  const getRoles = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.getRoles`)

    const roles = await store.role.listForResource({
      resource_type: 'deployment',
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

    create a role for a given deployment

    params:

    * id
    * user
    * username
    * permission
    
  */
  const createRole = ({
    id,
    user,
    username,
    permission,
  }) => store.transaction(async trx => {
    if(!id) throw new Error(`id must be given to controller.deployment.createRole`)
    if(!user && !username) throw new Error(`user or username must be given to controller.deployment.createRole`)
    if(!permission) throw new Error(`permission must be given to controller.deployment.createRole`)

    const userQuery = {}

    if(user) userQuery.id = user
    else if(username) userQuery.username = username

    const userRecord = await store.user.get(userQuery, trx)

    if(!userRecord) throw new Error(`no user found`)
    if(userRecord.permission == USER_TYPES.superuser) throw new Error(`cannot create role for superuser`)
    
    const existingRoles = await store.role.listForResource({
      resource_type: 'deployment',
      resource_id: id,
    }, trx)

    const existingRole = existingRoles.find(role => role.user == userRecord.id)

    if(existingRole) throw new Error(`this user already has a role for this deployment - delete it first`)

    return store.role.create({
      data: {
        resource_type: 'deployment',
        resource_id: id,
        user: userRecord.id,
        permission,
      },
    }, trx)
  })

  /*

    delete a role for a given deployment

    params:

    * id
    * user
    
  */
  const deleteRole = ({
    id,
    user,
  }) => store.transaction(async trx => {
    if(!id) throw new Error(`id must be given to controller.deployment.createRole`)
    if(!user) throw new Error(`user must be given to controller.deployment.createRole`)

    const roles = await store.role.listForResource({
      resource_type: 'deployment',
      resource_id: id,
    }, trx)

    const role = roles.find(role => role.user == user)
    if(!role) throw new Error(`no role for user ${user} found for deployment ${id}`)

    return store.role.delete({
      id: role.id,
    }, trx)
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
  
    get a collection of kubernetes resources for this deployment

     * pods
     * services
     * persistent volumes

    params:

     * id - the deployment id
  
  */
  const resources = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.resources`) 

    const deployment = await store.deployment.get({
      id,
    })

    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })

    const kubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const {
      deployment_type,
      deployment_version,
      applied_state,
    } = deployment

    const namespace = getField({
      deployment_type,
      deployment_version,
      data: applied_state,
      field: 'namespace',
    })

    const results = await {
      pods: await kubectl
        .jsonCommand(`-n ${namespace} get po`)
        .then(result => result.items),
      nodes: await kubectl
        .jsonCommand(`-n ${namespace} get no`)
        .then(result => result.items),
      services: await kubectl
        .jsonCommand(`-n ${namespace} get svc`)
        .then(result => result.items),
      volumes: await kubectl
        .jsonCommand(`-n ${namespace} get pvc`)
        .then(result => result.items),
    }

    return results
  }

  /*
  
    get a summary of the deployment state

    params:

     * id - the deployment id
  
  */
  const summary = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.summary`) 

    const deployment = await store.deployment.get({
      id,
    })

    const type = deploymentTemplates[deployment.deployment_type]
    if(!type) throw new Error(`unknown deployment_type: ${deployment.deployment_type}`)
    const summaryFunction = type.summary[deployment.deployment_version]
    if(!summaryFunction) throw new Error(`unknown deployment_version: ${deployment.deployment_version}`)

    return summaryFunction(deployment.desired_state)
  }

  const getKeyManagerKeys = async ({
    id,
  }) => {
    const keyPair = await KeyPair.get({
      store,
      deployment: id,
    })

    return keyManager.getKeys({
      id,
      sextantPublicKey: keyPair.publicKey,
    })
  }

  const getEnrolledKeys = async ({
    id,
  }) => {
/*
    const proxy = await DeploymentPodProxy({
      store,
      id,
    })

    const pods = await proxy.getPods()

    const result = await proxy.request({
      pod: pods[0].metadata.name,
      port: 8080,
      handler: ({
        port,
      }) => axios
        .get(`http://localhost:${port}/state`, {
          params: {
            address: Address.allowedKeys(),
            limit: 100,
          }
        })
        .then(res => res.data)
    })

    // TODO - process these results and return them instead of the fixtures
    console.log('--------------------------------------------')
    console.dir(result)
*/

    return settingsTP.getEnrolledKeys()
  }

  const addEnrolledKey = async ({
    id,
    publicKey,
  }) => {
    return settingsTP.addEnrolledKey({
      publicKey,
    })
  }

  const getParticipants = async ({
    id,
  }) => {
    return damlRPC.getParticipants({
      id
    })
  }

  const registerParticipant = async ({
    id,
    publicKey,
  }) => {

    if(!id) throw new Error(`id must be given to controller.deployment.registerParticipant`) 
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.registerParticipant`) 

    // Connection to DAML sawtooth rpc via GRPC.
    const proxy = await DeploymentPodProxy({
      store,
      id,
    })

    const pods = await proxy.getPods()
    const participantId = await proxy.request({
      pod: pods[0].metadata.name,
      port: 39000,
      handler: async ({
        port, // the local host port given to you
      }) => {
        const client = await ledger.DamlLedgerClient.connect({host: "localhost", port})
        const participantId = await client.partyManagementClient.getParticipantId();
        return participantId.participantId;
      }
    })

    return damlRPC.registerParticipant({
      participantId,
      publicKey,
    })
  }

  const rotateParticipantKey = async ({
    id,
    publicKey,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.rotateParticipantKey`) 
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.rotateParticipantKey`) 

    const newKey = await keyManager.rotateRPCKey({
      publicKey,
    })

    await damlRPC.updateKey({
      oldPublicKey: publicKey,
      newPublicKey: newKey,
    })

    return true
  }

  const addParty = async ({
    id,
    publicKey,
    partyName,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.addParty`) 
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.addParty`) 
    if(!partyName) throw new Error(`partyName must be given to controller.deployment.addParty`) 

    await damlRPC.addParty({
      id,
      publicKey,
      partyName,
    })

    return true
  }

  const removeParties = async ({
    id,
    publicKey,
    partyNames,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.removeParties`) 
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.removeParties`) 
    if(!partyNames) throw new Error(`partyNames must be given to controller.deployment.removeParties`) 

    await damlRPC.removeParties({
      publicKey,
      partyNames,
    })

    return true
  }

  const generatePartyToken = async ({
    id,
    publicKey,
    partyNames,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.generatePartyToken`) 
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.generatePartyToken`) 
    if(!partyNames) throw new Error(`partyNames must be given to controller.deployment.generatePartyToken`) 

    const token = await damlRPC.generatePartyToken({
      publicKey,
      partyNames,
    })

    return {
      token,
    }
  }

  const getArchives = async ({
    id,
  }) => {
    return damlRPC.getArchives({
      id,
    })
  }

  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.uploadArchive`) 
    if(!name) throw new Error(`name must be given to controller.deployment.uploadArchive`) 
    if(!size) throw new Error(`size must be given to controller.deployment.uploadArchive`) 
    if(!localFilepath) throw new Error(`localFilepath must be given to controller.deployment.uploadArchive`) 

    const data = await damlRPC.uploadArchive({
      id,
      name,
      size,
      localFilepath,
    })

    return data
  }

  const getTimeServiceInfo = async ({
    id,
  }) => {
    return damlRPC.getTimeServiceInfo()
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
    summary,
    getRoles,
    createRole,
    deleteRole,

    getKeyManagerKeys,
    getEnrolledKeys,
    addEnrolledKey,

    getParticipants,
    registerParticipant,
    rotateParticipantKey,

    addParty,
    removeParties,
    generatePartyToken,

    getArchives,
    uploadArchive,
    
    getTimeServiceInfo,
  }

}

module.exports = DeployentController