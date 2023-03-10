/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
const Promise = require('bluebird')
const config = require('../config')
const userUtils = require('../utils/user')
const ClusterKubectl = require('../utils/clusterKubectl')
const RBAC = require('../rbac')
const deploymentNames = require('../utils/deploymentNames')

const { getHelmDeploymentDetails } = require('../deployment_templates/templateLoader')
const validate = require('../forms/validate')

const { DEPLOYMENT_STATUS, USER_TYPES } = config

const DeploymentController = ({ store }) => {
  /*

    load the most recent task for each cluster so the frontend can display
    the task status of clusters in the table

    also load the cluster and inject the name so a user without RBAC access
    onto the cluster can at least see the cluster name

    params:

     * clusters

  */
  const loadAdditionalDeploymentData = ({ deployments }) => {
    const clusterCache = {}

    const loadClusterForDeployment = async ({ id }) => {
      if (clusterCache[id]) return clusterCache[id]
      const cluster = await store.cluster.get({
        id,
      })
      clusterCache[id] = cluster
      return cluster
    }

    return Promise.map(deployments, async (deployment) => {
      const task = await store.task.mostRecentForResource({
        deployment: deployment.id,
      })

      const cluster = await loadClusterForDeployment({
        id: deployment.cluster,
      })
      const updatedDeployment = deployment
      updatedDeployment.task = task
      updatedDeployment.clusterName = cluster.name
      return updatedDeployment
    })
  }
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
  const list = async ({ user, cluster, deleted, withTasks }) => {
    if (!user) throw new Error('user required for controllers.deployment.list')
    if (!cluster) throw new Error('cluster required for controllers.deployment.list')

    const deployments = await store.deployment.list({
      cluster,
      deleted,
    })

    const filteredDeployments = await Promise.filter(deployments, async (deployment) => {
      const canSeeDeployment = await RBAC(store, user, {
        resource_type: 'deployment',
        resource_id: deployment.id,
        method: 'get',
      })
      return canSeeDeployment
    })

    if (withTasks) {
      return loadAdditionalDeploymentData({
        deployments: filteredDeployments,
      })
    }

    return filteredDeployments
  }

  /*

    get a deployment

    params:

     * id
     * withTask - should we load the latest task into the result

  */
  const get = async ({ id, withTask }) => {
    if (!id) throw new Error('id must be given to controller.deployment.get')

    const deployment = await store.deployment.get({
      id,
    })

    if (!deployment) return null

    if (withTask) {
      const task = await store.task.mostRecentForResource({
        deployment: id,
      })

      deployment.task = task
    }

    return deployment
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
    data: { name, deployment_type, deployment_version, desired_state, custom_yaml },
  }) => {
    if (!user) throw new Error('user required for controllers.deployment.create')
    if (!name) throw new Error('data.name required for controllers.deployment.create')
    if (!deployment_type) throw new Error('data.deployment_type required for controllers.deployment.create')
    if (!deployment_version) throw new Error('data.deployment_version required for controllers.deployment.create')
    if (!desired_state) throw new Error('data.desired_state required for controllers.deployment.create')

    return store.transaction(async (trx) => {
      const deploymentTemplates = getHelmDeploymentDetails()

      const typeForm = deploymentTemplates[deployment_type]
      if (!typeForm) throw new Error(`unknown deployment_type: ${deployment_type}`)

      const schema = typeForm.forms[deployment_version]
      if (!schema) throw new Error(`unknown deployment_type: ${deployment_type} version ${deployment_version}`)

      // validate the incoming form data
      await validate({
        schema,
        data: desired_state,
      })

      // check there is no cluster already with that name
      const deployments = await store.deployment.list({
        cluster,
      })

      const existingDeployment = deployments.find(
        (currentDeployment) => currentDeployment.name.toLowerCase() === name.toLowerCase()
      )
      if (existingDeployment) throw new Error(`there is already a deployment with the name ${name}`)

      // determine if there is a helm chart for this deployment type
      // create the deployment record
      const deployment = await store.deployment.create(
        {
          data: {
            name,
            cluster,
            deployment_type,
            deployment_version,
            desired_state,
            custom_yaml,
            deployment_method: 'helm',
          },
        },
        trx
      )

      // if the user is not a super-user - create a role for the user against the cluster
      if (!userUtils.isSuperuser(user)) {
        await store.role.create(
          {
            data: {
              user: user.id,
              permission: config.PERMISSION_TYPES.write,
              resource_type: config.RESOURCE_TYPES.deployment,
              resource_id: deployment.id,
            },
          },
          trx
        )
      }

      return store.task.create(
        {
          data: {
            user: user.id,
            resource_type: config.RESOURCE_TYPES.deployment,
            resource_id: deployment.id,
            action: config.TASK_ACTION['deployment.create'],
            restartable: true,
            payload: {},
            resource_status: {
              completed: 'provisioned',
              error: 'error',
            },
          },
        },
        trx
      )
    })
  }

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
  const update = ({ id, user, data }) =>
    store.transaction(async (trx) => {
      if (!id) throw new Error('id must be given to controller.deployment.update')
      if (!user) throw new Error('user must be given to controller.deployment.update')
      if (!data) throw new Error('data must be given to controller.deployment.update')

      // check to see if there are active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          deployment: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this deployment')

      // get the existing cluster
      const deployment = await store.deployment.get(
        {
          id,
        },
        trx
      )

      if (!deployment) throw new Error(`no deployment with that id found: ${id}`)

      const deploymentTemplates = getHelmDeploymentDetails()
      const schema = deploymentTemplates[deployment.deployment_type].forms[deployment.deployment_version]

      // validate the form data
      await validate({
        schema,
        data: data.desired_state,
      })

      // save the deployment
      await store.deployment.update(
        {
          id,
          data,
        },
        trx
      )

      return store.task.create(
        {
          data: {
            user: user.id,
            resource_type: config.RESOURCE_TYPES.deployment,
            resource_id: deployment.id,
            action: config.TASK_ACTION['deployment.update'],
            restartable: true,
            payload: {},
            resource_status: {
              completed: 'provisioned',
              error: 'error',
            },
          },
        },
        trx
      )
    })

  /*

    get the roles for a given deployment

    params:

     * id

  */
  const getRoles = async ({ id }) => {
    if (!id) throw new Error('id must be given to controller.deployment.getRoles')

    const roles = await store.role.listForResource({
      resource_type: 'deployment',
      resource_id: id,
    })

    return Promise.map(roles, async (role) => {
      const user = await store.user.get({
        id: role.user,
      })
      const updatedRole = role
      updatedRole.userRecord = userUtils.safe(user)
      return updatedRole
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
  const createRole = ({ id, user, username, permission }) => {
    if (!id) throw new Error('id must be given to controller.deployment.createRole')
    if (!user && !username) throw new Error('user or username must be given to controller.deployment.createRole')
    if (!permission) throw new Error('permission must be given to controller.deployment.createRole')
    return store.transaction(async (trx) => {
      const userQuery = {}

      if (user) userQuery.id = user
      else if (username) userQuery.username = username

      const userRecord = await store.user.get(userQuery, trx)

      if (!userRecord) throw new Error('no user found')
      if (userRecord.permission === USER_TYPES.superuser) throw new Error('cannot create role for superuser')

      const existingRoles = await store.role.listForResource(
        {
          resource_type: 'deployment',
          resource_id: id,
        },
        trx
      )

      const existingRole = existingRoles.find((role) => role.user === userRecord.id)

      if (existingRole) throw new Error('this user already has a role for this deployment - delete it first')

      return store.role.create(
        {
          data: {
            resource_type: 'deployment',
            resource_id: id,
            user: userRecord.id,
            permission,
          },
        },
        trx
      )
    })
  }
  /*

    delete a role for a given deployment

    params:

    * id
    * user

  */
  const deleteRole = ({ id, user }) =>
    store.transaction(async (trx) => {
      if (!id) throw new Error('id must be given to controller.deployment.createRole')
      if (!user) throw new Error('user must be given to controller.deployment.createRole')

      const roles = await store.role.listForResource(
        {
          resource_type: 'deployment',
          resource_id: id,
        },
        trx
      )

      // eslint-disable-next-line eqeqeq
      const role = roles.find((oneRole) => oneRole.user == user)
      if (!role) throw new Error(`no role for user ${user} found for deployment ${id}`)

      return store.role.delete(
        {
          id: role.id,
        },
        trx
      )
    })

  /*

    get the tasks for a given deployment

    params:

     * id

  */
  const getTasks = ({ id }) => {
    if (!id) throw new Error('id must be given to controller.deployment.getTasks')

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
  const del = ({ user, id }) =>
    store.transaction(async (trx) => {
      if (!user) throw new Error('user required for controllers.deployment.delete')
      if (!id) throw new Error('id must be given to controller.deployment.delete')

      // check there are no active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          deployment: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this deployment')

      // create a delete task
      return store.task.create(
        {
          data: {
            user: user.id,
            resource_type: config.RESOURCE_TYPES.deployment,
            resource_id: id,
            action: config.TASK_ACTION['deployment.delete'],
            restartable: true,
            payload: {},
            resource_status: {
              completed: 'deleted',
              error: 'error',
            },
          },
        },
        trx
      )
    })

  /*

    delete a deployment - i.e. actually delete it from disk
    a deployment *must* be in the `deleted` state to do this

    params:

     * user - the user that is deleting the deployment
     * id

  */
  const deletePermanently = ({ user, id }) =>
    store.transaction(async (trx) => {
      if (!user) throw new Error('user required for controllers.deployment.delete')
      if (!id) throw new Error('id must be given to controller.deployment.delete')

      // check there are no active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          deployment: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this deployment')

      const deployment = await store.deployment.get(
        {
          id,
        },
        trx
      )

      if (deployment.status !== DEPLOYMENT_STATUS.deleted)
        throw new Error('a deployment must be in deleted status to be deleted permanently')

      // delete the cluster tasks, roles and then the cluster
      await store.task.deleteForResource(
        {
          resource_type: 'deployment',
          resource_id: deployment.id,
        },
        trx
      )
      await store.role.deleteForResource(
        {
          resource_type: 'deployment',
          resource_id: deployment.id,
        },
        trx
      )
      await store.deployment.delete(
        {
          id: deployment.id,
        },
        trx
      )

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
  const resources = async ({ id }) => {
    if (!id) throw new Error('id must be given to controller.deployment.resources')

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

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    const options = {}
    const podsBody = await kubectl.getPods(namespace, options)
    const pods = podsBody.items || []
    const nodesBody = await kubectl.getNodes()
    const nodes = nodesBody.items || []
    const servicesBody = await kubectl.getServices(namespace, options)
    const services = servicesBody.items || []
    const volumesBody = await kubectl.getPersistentVolumeClaims(namespace, options)
    const volumes = volumesBody.items || []

    return {
      pods,
      nodes,
      services,
      volumes,
    }
  }

  /*

  delete a pod on a given kubernetes cluster

  params:

   * id - the deployment id
   * pod - the pod name

*/
  const deletePod = async ({ id, pod }) => {
    if (!id) throw new Error('id must be given to controller.deployment.deletePod')
    if (!pod) throw new Error('pod must be given to controller.deployment.deletePod')

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

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    await kubectl.deletePod(namespace, pod)
  }

  /*

    get a summary of the deployment state

    params:

     * id - the deployment id

  */
  const summary = async ({ id }) => {
    if (!id) throw new Error('id must be given to controller.deployment.summary')

    const deployment = await store.deployment.get({
      id,
    })

    const deploymentTemplates = getHelmDeploymentDetails()
    const type = deploymentTemplates[deployment.deployment_type]
    if (!type) throw new Error(`unknown deployment_type: ${deployment.deployment_type}`)
    const summaryFunction = type.summary[deployment.deployment_version]
    if (!summaryFunction) throw new Error(`unknown deployment_version: ${deployment.deployment_version}`)

    return summaryFunction(deployment.desired_state)
  }

  return {
    list,
    get,
    create,
    update,
    getTasks,
    delete: del,
    deletePermanently,
    resources,
    deletePod,
    summary,
    getRoles,
    createRole,
    deleteRole,
  }
}

module.exports = DeploymentController
