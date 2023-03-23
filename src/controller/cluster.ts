/* eslint-disable camelcase */
import * as k8s from '@kubernetes/client-node'
import bluebird from 'bluebird'
import { Knex } from 'knex'
import {
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS,
  DEPLOYMENT_STATUS,
  PERMISSION_TYPES,
  RESOURCE_TYPES,
  TASK_ACTION,
} from '../config'
import { K8S_CREDENTIALS_SECRET_NAME } from '../constants'
import clusterForms from '../forms/cluster'
import { ClusterAddUserForm } from '../forms/schema/cluster'
import validate from '../forms/validate'
import { RBAC } from '../rbac'
import { Store } from '../store'
import { Cluster, Role, Task, User } from '../store/model/model-types'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { decode } from '../utils/base64'
import * as clusterUtils from '../utils/cluster'
import { Kubectl } from '../utils/kubectl'
import * as userUtils from '../utils/user'
import { createRoleForResource } from './createRole'
import {
  ClusterCreateRequestV1,
  ClusterCreateRoleRequest,
  ClusterDeletePermanentlyRequest,
  ClusterDeleteRequest,
  ClusterDeleteRoleRequest,
  ClusterGetRequest,
  ClusterGetRolesRequest,
  ClusterGetTasksRequest,
  ClusterListRequest,
  ClusterResourcesRequest,
  ClusterSummaryRequest,
  ClusterUpdateRequest,
  ClusterUpdateUserPTRequest,
} from './signals'

export const ClusterController = ({ store }: { store: Store }) => {
  /*

    list clusters

    params:

     * user - the user that is viewing the list
     * deleted - include deleted clusters in the list

    if the is an superuser role - then load all clusters

    otherwise, load clusters that have at least a read role for the
    given user

  */
  const list = async ({ user, deleted, withTasks }: ClusterListRequest) => {
    if (!user) throw new Error('user required for controllers.cluster.list')

    const currentClusters = await store.cluster.list({
      deleted,
    })

    const filteredClusters = await bluebird.filter(currentClusters, async (cluster) => {
      const canSeeCluster = await RBAC(store, user, {
        resource_type: 'cluster',
        resource_id: cluster.id,
        method: 'get',
      })
      return canSeeCluster
    })

    /*
    load the most recent task for each cluster so the frontend can display
    the task status of clusters in the table

    params:

     * clusters
    */
    const loadMostRecentTasksForClusters = ({ clusters }: { clusters: Cluster[] }) =>
      Promise.all(
        clusters.map(async (cluster) => {
          const task = await store.task.mostRecentForResource({
            cluster: cluster.id,
          })

          return {
            ...cluster,
            task,
          }
        })
      )

    if (withTasks) {
      return loadMostRecentTasksForClusters({
        clusters: filteredClusters,
      })
    }

    return filteredClusters as (Cluster & { task?: Task })[]
  }

  /*
    get a cluster

    params:

     * id
     * withTask - should we load the latest task into the result
  */
  const get = async ({ id, withTask }: ClusterGetRequest) => {
    if (!id) throw new Error('id must be given to controller.cluster.update')

    const cluster = await store.cluster.get({
      id,
    })

    if (!cluster) return null

    if (withTask) {
      const task = await store.task.mostRecentForResource({
        cluster: id,
      })
      return {
        ...cluster,
        task,
      }
    }

    return cluster as Cluster & { task?: Task }
  }

  /*
    insert the cluster secrets into the store
    and update the cluster desired_state to point at their ids

    params:

     * cluster
     * desired_state
     * secrets
  */
  const createClusterSecrets = async (
    {
      cluster,
      desired_state,
      secrets,
    }: {
      cluster: Cluster
      desired_state: object
      secrets: {
        ca?: {
          rawData: string
        }
        token?: {
          rawData: string
        }
      }
    },
    trx: Knex.Transaction
  ) => {
    const createdSecrets: {
      ca?: {
        id: DatabaseIdentifier
      }
      token?: {
        id: DatabaseIdentifier
      }
    } = {}

    if (secrets.token) {
      createdSecrets.token = await store.clustersecret.create(
        {
          data: {
            cluster: cluster.id,
            name: 'token',
            rawData: secrets.token.rawData,
          },
        },
        trx
      )
    }

    if (secrets.ca) {
      createdSecrets.ca = await store.clustersecret.create(
        {
          data: {
            cluster: cluster.id,
            name: 'ca',
            rawData: secrets.ca.rawData,
          },
        },
        trx
      )
    }

    const { applied_state } = cluster

    const updatedDesiredState: typeof desired_state & {
      ca?: unknown
      ca_id?: unknown
      token?: unknown
      token_id?: unknown
    } = { ...desired_state }

    if (createdSecrets.token) {
      updatedDesiredState.token_id = createdSecrets.token.id
    } else if (applied_state && applied_state.token_id) {
      updatedDesiredState.token_id = applied_state.token_id
    }

    if (createdSecrets.ca) {
      updatedDesiredState.ca_id = createdSecrets.ca.id
    } else if (applied_state && applied_state.ca_id) {
      updatedDesiredState.ca_id = applied_state.ca_id
    }

    delete updatedDesiredState.ca
    delete updatedDesiredState.token

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
  const create = ({ user, data: { name, provision_type, desired_state, capabilities } }: ClusterCreateRequestV1) =>
    store.transaction(async (trx) => {
      if (!user) throw new Error('user required for controllers.cluster.create')
      if (!name) throw new Error('data.name required for controllers.cluster.create')
      if (!provision_type) throw new Error('data.provision_type required for controllers.cluster.create')
      if (!desired_state) throw new Error('data.desired_state required for controllers.cluster.create')

      if (!CLUSTER_PROVISION_TYPE[provision_type]) throw new Error(`unknown provision_type: ${provision_type}`)

      const extractedSecrets = clusterUtils.extractClusterSecrets({
        desired_state,
      })

      // validate the incoming form data
      await validate({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        schema: clusterForms.server[provision_type].add,
        data: {
          name,
          provision_type,
          desired_state,
          capabilities,
        },
      })

      // check there is no cluster already with that name
      const clusters = await store.cluster.list({ deleted: false })
      const existingCluster = clusters.find(
        (currentCluster) => currentCluster.name.toLowerCase() === name.toLowerCase()
      )
      if (existingCluster) throw new Error(`there is already a cluster with the name ${name}`)

      // create the cluster record
      const cluster = await store.cluster.create(
        {
          data: {
            name,
            provision_type,
            capabilities,
            desired_state: {},
          },
        },
        trx
      )

      // insert the cluster secrets for that cluster
      const updatedDesiredState = await createClusterSecrets(
        {
          cluster,
          secrets: extractedSecrets.secrets,
          desired_state: extractedSecrets.desired_state,
        },
        trx
      )

      // update the cluster desired state with pointers to the secrets; removal of updatedCluster breaks tests
      await store.cluster.update(
        {
          id: cluster.id,
          data: {
            desired_state: updatedDesiredState,
          },
        },
        trx
      )

      await createRoleForCluster(user, cluster, trx)

      return await createProvisionTask(user, cluster, trx)
    })

  const createUserPT = ({ user, data }: { data: ClusterAddUserForm; user: User }) =>
    store.transaction(async (trx) => {
      const name = data.cluster.name
      // check there is no cluster already with that name
      const clusters = await store.cluster.list({ deleted: false })
      const existingCluster = clusters.find(
        (currentCluster) => currentCluster.name.toLowerCase() === name.toLowerCase()
      )
      if (existingCluster) throw new Error(`there is already a cluster with the name ${name}`)

      // create the cluster record
      const cluster = await store.cluster.create(
        {
          data: {
            name,
            provision_type: data.provision_type,
            capabilities: [],
            desired_state: {
              ...data,
            },
          },
        },
        trx
      )

      const credentialsData = {
        data: {
          name: K8S_CREDENTIALS_SECRET_NAME,
          cluster: cluster.id,
          rawData: JSON.stringify(data),
        },
      }

      await store.clustersecret.create(credentialsData, trx)

      await createRoleForCluster(user, cluster, trx)

      return await createProvisionTask(user, cluster, trx)
    })

  const createProvisionTask = (user: User, cluster: Cluster, trx: Knex.Transaction) => {
    return store.task.create(
      {
        data: {
          user: user.id,
          resource_type: RESOURCE_TYPES.cluster,
          resource_id: cluster.id,
          action: TASK_ACTION['cluster.create'],
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
  }

  const createRoleForCluster = async (user: User, cluster: Cluster, trx: Knex.Transaction) => {
    // if the user is not a super-user - create a role for the user against the cluster
    if (!userUtils.isSuperuser(user)) {
      await store.role.create(
        {
          data: {
            user: user.id,
            permission: PERMISSION_TYPES.write,
            resource_type: RESOURCE_TYPES.cluster,
            resource_id: cluster.id,
          },
        },
        trx
      )
    }
  }

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
  const update = ({ id, user, data }: ClusterUpdateRequest) =>
    store.transaction(async (trx) => {
      if (!id) throw new Error('id must be given to controller.cluster.update')
      if (!user) throw new Error('user must be given to controller.cluster.update')
      if (!data) throw new Error('data must be given to controller.cluster.update')

      // extract the fields that are actually given in the payload
      const formData: {
        desired_state?: {
          [key: string]: unknown
        }
        maintenance_flag?: boolean
        name?: string
        provision_type?: string
      } = ['name', 'provision_type', 'desired_state', 'maintenance_flag'].reduce((all, field) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (data[field]) all[field] = data[field]
        return all
      }, {})

      // check to see if there are active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          cluster: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this cluster')

      // get the existing cluster
      const cluster = await store.cluster.get(
        {
          id,
        },
        trx
      )

      if (!cluster) throw new Error(`no cluster with that id found: ${id}`)

      // validate the form data
      await validate({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        schema: clusterForms.server[cluster.provision_type].edit,
        data: formData,
      })

      // inject the processed desired state into the submission data
      if (formData.desired_state) {
        // extract the secrets from the form data
        const extractedSecrets = clusterUtils.extractClusterSecrets({
          desired_state: formData.desired_state,
        })

        // insert the new secrets into the database
        const updatedDesiredState = await createClusterSecrets(
          {
            cluster,
            desired_state: formData.desired_state,
            secrets: extractedSecrets.secrets,
          },
          trx
        )

        formData.desired_state = updatedDesiredState
      }

      await store.cluster.update(
        {
          id,
          data: formData,
        },
        trx
      )

      // if there is an update to the desired state
      // trigger a task to update it
      return await createUpdateTask(user, cluster, trx)
    })

  const updateUserPT = ({ id, user, data }: ClusterUpdateUserPTRequest) =>
    store.transaction(async (trx) => {
      // check to see if there are active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          cluster: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this cluster')

      // get the existing cluster
      const cluster = await store.cluster.get(
        {
          id,
        },
        trx
      )

      if (!cluster) throw new Error(`no cluster with that id found: ${id}`)

      const k8sCredentials = await store.clustersecret.get({
        cluster: cluster.id,
        name: K8S_CREDENTIALS_SECRET_NAME,
      })
      if (k8sCredentials) {
        const partialCreds = JSON.parse(decode(k8sCredentials.base64data).toString()) as {
          cluster: k8s.Cluster
          user: k8s.User
        }

        const newCreds = {
          cluster: {
            ...partialCreds.cluster,
            ...data.cluster,
          },
          user: {
            ...partialCreds.user,
            ...data.user,
          },
        }

        await store.clustersecret.update({
          cluster: cluster.id,
          name: K8S_CREDENTIALS_SECRET_NAME,
          data: {
            rawData: JSON.stringify(newCreds),
          },
        })
      }

      await store.cluster.update(
        {
          id,
          data: {
            name: data.cluster.name || cluster.name,
          },
        },
        trx
      )

      // if there is an update to the desired state
      // trigger a task to update it
      return await createUpdateTask(user, cluster, trx)
    })

  const createUpdateTask = async (user: User, cluster: Cluster, trx: Knex.Transaction) => {
    return await store.task.create(
      {
        data: {
          user: user.id,
          resource_type: RESOURCE_TYPES.cluster,
          resource_id: cluster.id,
          action: TASK_ACTION['cluster.update'],
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
  }

  /*
    delete a cluster

    params:

     * user - the user that is creating the cluster
     * id
  */
  const del = ({ user, id }: ClusterDeleteRequest) =>
    store.transaction(async (trx) => {
      if (!user) throw new Error('user required for controllers.cluster.delete')
      if (!id) throw new Error('id must be given to controller.cluster.delete')

      // check there are no active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          cluster: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this cluster')

      // create a delete task
      const task = await store.task.create(
        {
          data: {
            user: user.id,
            resource_type: RESOURCE_TYPES.cluster,
            resource_id: id,
            action: TASK_ACTION['cluster.delete'],
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

      return task
    })

  /*
    delete a cluster - i.e. actually delete it from disk
    a cluster *must* be in the `deleted` state to do this

    params:

     * user - the user that is creating the cluster
     * id
  */
  const deletePermanently = ({ id }: ClusterDeletePermanentlyRequest) =>
    store.transaction(async (trx) => {
      if (!id) throw new Error('id must be given to controller.cluster.delete')

      // check there are no active tasks for this cluster
      const activeTasks = await store.task.activeForResource(
        {
          cluster: id,
        },
        trx
      )

      if (activeTasks.length > 0) throw new Error('there are active tasks for this cluster')

      const cluster = await store.cluster.get(
        {
          id,
        },
        trx
      )

      if (cluster.status !== CLUSTER_STATUS.deleted)
        throw new Error('a cluster must be in deleted status to be deleted permanently')

      // get a list of deployments for this cluster and check they are all in deleted status
      const deployments = await store.deployment.list(
        {
          cluster: id,
          deleted: true,
        },
        trx
      )

      const nonDeletedDeployments = deployments.filter((deployment) => deployment.status !== DEPLOYMENT_STATUS.deleted)

      if (nonDeletedDeployments.length > 0)
        throw new Error('all deployments for this cluster must be in deleted state to be deleted permanently')
      // loop over each deployment and remove, tasks and roles and then the deployment
      await bluebird.each(deployments, async (deployment) => {
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
      })

      // delete the cluster tasks, roles and then the cluster
      await store.task.deleteForResource(
        {
          resource_type: 'cluster',
          resource_id: cluster.id,
        },
        trx
      )
      await store.role.deleteForResource(
        {
          resource_type: 'cluster',
          resource_id: cluster.id,
        },
        trx
      )
      await store.cluster.deletePermanently(
        {
          id: cluster.id,
        },
        trx
      )

      return true
    })

  /*
    get the roles for a given cluster

    params:

     * id
  */
  const getRoles = async ({ id }: ClusterGetRolesRequest) => {
    if (!id) throw new Error('id must be given to controller.cluster.getRoles')

    const roles = await store.role.listForResource({
      resource_type: 'cluster',
      resource_id: id,
    })

    const mappedRoles = await Promise.all(
      roles.map(async (role) => {
        const user = await store.user.get({
          id: role.user,
        })
        if (user) {
          const userRecord = userUtils.safe(user)
          return { role, userRecord }
        }
        return { role, userRecord: undefined } as { role: Role; userRecord: userUtils.SafeUser | undefined }
      })
    )
    return mappedRoles
      .filter((r) => {
        if (r.userRecord) {
          return true
        } else {
          return false
        }
      })
      .map((r) => {
        return { ...r.role, userRecord: r.userRecord }
      })
  }

  /*
    create a role for a given cluster

    params:

     * id
     * user
     * username
     * permission
  */
  const createRole = ({ id, user, username, permission }: ClusterCreateRoleRequest) =>
    createRoleForResource({ id, user, username, permission, resource_type: 'cluster' }, store)

  /*
    delete a role for a given cluster

    params:

     * id
     * user
  */
  const deleteRole = ({ id, user }: ClusterDeleteRoleRequest) =>
    store.transaction(async (trx) => {
      if (!id) throw new Error('id must be given to controller.cluster.createRole')
      if (!user) throw new Error('user must be given to controller.cluster.createRole')

      const roles = await store.role.listForResource(
        {
          resource_type: 'cluster',
          resource_id: id,
        },
        trx
      )

      // eslint-disable-next-line eqeqeq
      const role = roles.find((currentRole) => currentRole.user == user)
      if (!role) throw new Error(`no role for user ${user} found for cluster ${id}`)

      return store.role.delete(
        {
          id: role.id,
        },
        trx
      )
    })

  /*
    get the tasks for a given cluster

    params:

     * id
  */
  const getTasks = ({ id }: ClusterGetTasksRequest) => {
    if (!id) throw new Error('id must be given to controller.cluster.getTasks')

    return store.task.list({
      cluster: id,
    })
  }

  /*
    get a collection of kubernetes resources for this cluster

     * nodes

    params:

     * id - the cluster id
  */
  const resources = async ({ id }: ClusterResourcesRequest) => {
    if (!id) throw new Error('id must be given to controller.cluster.resources')

    const cluster = await store.cluster.get({
      id,
    })

    const kubectl = await Kubectl.getKubectlForCluster({
      cluster,
      store,
    })

    return bluebird.props({
      nodes: kubectl.getNodes().then((result) => result.items),
    })
  }

  /*
    get a summary of the cluster state

    params:

     * id - the cluster id
  */
  const summary = async ({ id }: ClusterSummaryRequest) => {
    if (!id) throw new Error('id must be given to controller.cluster.summary')

    const cluster = await store.cluster.get({
      id,
    })

    const fields = [
      {
        title: 'Name',
        value: cluster.name,
      },
      {
        title: 'Provision Type',
        value: cluster.provision_type,
      },
    ]

    return fields
  }

  return {
    list,
    get,
    create,
    createUserPT,
    update,
    updateUserPT,
    delete: del,
    deletePermanently,
    getRoles,
    createRole,
    deleteRole,
    getTasks,
    resources,
    summary,
  }
}
