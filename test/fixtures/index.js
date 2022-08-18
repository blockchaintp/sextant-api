const Promise = require('bluebird')
const config = require('../../src/config')
const userUtils = require('../../src/utils/user')
const UserStore = require('../../src/store/user')
const ClusterStore = require('../../src/store/cluster').default
const DeployentStore = require('../../src/store/deployment')
const RoleStore = require('../../src/store/role')
const TaskStore = require('../../src/store/task')

const { USER_TYPES, CLUSTER_PROVISION_TYPE, PERMISSION_TYPES, RESOURCE_TYPES, TASK_ACTION } = config

const SIMPLE_USER_DATA = [USER_TYPES.superuser, USER_TYPES.admin, USER_TYPES.user].map((permission) => ({
  username: permission,
  password: `${permission}password`,
  permission,
}))

const SIMPLE_CLUSTER_DATA = [
  {
    name: 'testcluster',
    provision_type: CLUSTER_PROVISION_TYPE.local,
    desired_state: {
      apples: 10,
    },
    capabilities: {
      funkyFeature: true,
    },
  },
  {
    name: 'othercluster',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    desired_state: {
      oranges: 10,
      apiServer: 'https://apiserver.com',
      ca: '-----BEGIN CERTIFICATE-----SOME DATA-----END CERTIFICATE-----',
      token: 'oranges_token',
    },
    capabilities: {
      otherFunkyFeature: true,
    },
  },
]

// additional cluster data to test get route
const GET_CLUSTER_DATA = [
  {
    name: 'joinedcluster',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    desired_state: {
      apples: 5,
    },
    capabilities: {
      funkyFeature: true,
    },
  },
]

const SIMPLE_DEPLOYMENT_DATA = [
  {
    name: 'testdeployment',
    deployment_type: 'sawtooth',
    deployment_version: '1.0',
    desired_state: {
      apples: 10,
    },
  },
  {
    name: 'otherdeployment',
    deployment_type: 'sawtooth',
    deployment_version: '1.0',
    desired_state: {
      oranges: 10,
    },
  },
]

const SIMPLE_ROLE_DATA = [
  {
    permission: PERMISSION_TYPES.read,
    resource_type: RESOURCE_TYPES.cluster,
    resource_id: 10,
  },
  {
    permission: PERMISSION_TYPES.write,
    resource_type: RESOURCE_TYPES.deployment,
    resource_id: 11,
  },
]

const SIMPLE_TASK_DATA = [
  {
    resource_type: RESOURCE_TYPES.cluster,
    resource_id: 10,
    restartable: true,
    action: TASK_ACTION['cluster.create'],
    payload: {
      apples: 10,
    },
  },
  {
    resource_type: RESOURCE_TYPES.deployment,
    resource_id: 11,
    restartable: false,
    action: TASK_ACTION['deployment.create'],
    payload: {
      oranges: 10,
    },
  },
]

const getTestUserData = async (data) => {
  const hashed_password = await userUtils.getPasswordHash(data.password)

  return {
    username: data.username,
    permission: data.permission,
    hashed_password,
    server_side_key: userUtils.getTokenServerSideKey(),
  }
}

const insertTestUsers = async (databaseConnection, data) => {
  data = data || SIMPLE_USER_DATA

  const store = UserStore(databaseConnection)

  // map of usernames onto database records
  const userMap = {}

  await Promise.each(data, async (userData) => {
    const testUserData = await getTestUserData(userData)
    const user = await store.create({
      data: testUserData,
    })
    userMap[user.username] = user
    return user
  })

  return userMap
}

const insertTestClusters = async (databaseConnection, data) => {
  data = data || SIMPLE_CLUSTER_DATA

  const store = ClusterStore(databaseConnection)

  // map of cluster names onto database records
  const clusterMap = {}

  await Promise.each(data, async (clusterData) => {
    const cluster = await store.create({
      data: clusterData,
    })

    clusterMap[cluster.name] = cluster

    return cluster
  })

  return clusterMap
}

const insertTestDeployments = async (databaseConnection, cluster, data) => {
  data = data || SIMPLE_DEPLOYMENT_DATA

  const store = DeployentStore(databaseConnection)

  // map of cluster names onto database records
  const deploymentMap = {}

  await Promise.each(data, async (deploymentData) => {
    const insertData = { ...deploymentData, cluster }

    const deployment = await store.create({
      data: insertData,
    })

    deploymentMap[deployment.name] = deployment

    return deployment
  })

  return deploymentMap
}

const insertTestRoles = async (databaseConnection, user, data) => {
  data = data || SIMPLE_ROLE_DATA

  const store = RoleStore(databaseConnection)

  // map of resource types onto database records
  const roleMap = {}

  await Promise.each(data, async (roleData) => {
    const insertData = { ...roleData, user }

    const role = await store.create({
      data: insertData,
    })

    roleMap[role.resource_type] = role

    return role
  })

  return roleMap
}

const insertTestTasks = async (databaseConnection, user, data) => {
  data = data || SIMPLE_TASK_DATA

  const store = TaskStore(databaseConnection)

  // map of resource types onto database records
  const taskMap = {}

  await Promise.each(data, async (taskData) => {
    const insertData = { ...taskData, user }

    const task = await store.create({
      data: insertData,
    })

    taskMap[task.id] = task

    return task
  })

  return taskMap
}

module.exports = {
  SIMPLE_USER_DATA,
  SIMPLE_CLUSTER_DATA,
  GET_CLUSTER_DATA,
  SIMPLE_DEPLOYMENT_DATA,
  SIMPLE_ROLE_DATA,
  SIMPLE_TASK_DATA,
  getTestUserData,
  insertTestUsers,
  insertTestClusters,
  insertTestDeployments,
  insertTestRoles,
  insertTestTasks,
}
