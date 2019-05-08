'use strict'

const Promise = require('bluebird')
const async = require('async')
const config = require('../../src/config')
const userUtils = require('../../src/utils/user')
const UserStore = require('../../src/store/user')
const ClusterStore = require('../../src/store/cluster')
const DeployentStore = require('../../src/store/deployment')
const RoleStore = require('../../src/store/role')
const TaskStore = require('../../src/store/task')

const {
  PERMISSION_USER,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ROLE,
  RESOURCE_TYPES,
  TASK_ACTION,
} = config

const SIMPLE_USER_DATA = [
  PERMISSION_USER.superuser,
  PERMISSION_USER.admin,
  PERMISSION_USER.user,
].map(permission => ({
  username: permission,
  password: `${permission}password`,
  permission,
}))

const SIMPLE_CLUSTER_DATA = [{
  name: 'testcluster',
  provision_type: CLUSTER_PROVISION_TYPE.local,
  desired_state: {
    apples: 10,
  },
  capabilities: {
    funkyFeature: true,
  },
},{
  name: 'othercluster',
  provision_type: CLUSTER_PROVISION_TYPE.remote,
  desired_state: {
    oranges: 10,
    apiServer: 'https://apiserver.com',
    ca: 'oranges_ca',
    token: 'oranges_token',
  },
  capabilities: {
    otherFunkyFeature: true,
  },
}]

const SIMPLE_DEPLOYMENT_DATA = [{
  name: 'testdeployment',
  desired_state: {
    apples: 10,
  },
},{
  name: 'otherdeployment',
  desired_state: {
    oranges: 10,
  },
}]

const SIMPLE_ROLE_DATA = [{
  permission: PERMISSION_ROLE.read,
  resource_type: RESOURCE_TYPES.cluster,
  resource_id: 10,
}, {
  permission: PERMISSION_ROLE.write,
  resource_type: RESOURCE_TYPES.deployment,
  resource_id: 11,
}]

const SIMPLE_TASK_DATA = [{
  resource_type: RESOURCE_TYPES.cluster,
  resource_id: 10,
  restartable: true,
  action: TASK_ACTION['cluster.create'],
  payload: {
    apples: 10,
  },
}, {
  resource_type: RESOURCE_TYPES.deployment,
  resource_id: 11,
  restartable: false,
  action: TASK_ACTION['deployment.create'],
  payload: {
    oranges: 10,
  },
}]

const getTestUserData = (data, done) => {
  async.parallel({
    hashed_password: (next) => userUtils.getPasswordHash(data.password, next),
  }, (err, values) => {
    if(err) return done(err)
    const userData = {
      username: data.username,
      permission: data.permission,
      hashed_password: values.hashed_password,
      server_side_key: userUtils.getTokenServerSideKey()
    }
    done(null, userData)
  })
}

const insertTestUsers = (databaseConnection, data, done) => {

  if(!done) {
    done = data
    data = SIMPLE_USER_DATA
  }

  const store = UserStore(databaseConnection)

  // map of usernames onto database records
  const userMap = {}

  async.eachSeries(data, (userData, nextUser) => {
    getTestUserData(userData, (err, data) => {
      if(err) return nextUser(err)
      store.create({
        data
      }, (err, user) => {
        if(err) return nextUser(err)
        userMap[user.username] = user
        nextUser()
      })
    })
  }, (err) => {
    if(err) return done(err)
    done(null, userMap)
  })
}

const insertTestClusters = async (databaseConnection, data) => {

  data = data || SIMPLE_CLUSTER_DATA
  
  const store = ClusterStore(databaseConnection)

  // map of cluster names onto database records
  const clusterMap = {}

  await Promise.each(data, async (clusterData) => {
    const cluster = await store.create({
      data: clusterData
    })

    clusterMap[cluster.name] = cluster

    return cluster
  })

  return clusterMap
}

const insertTestDeployments = (databaseConnection, cluster, data, done) => {

  if(!done) {
    done = data
    data = SIMPLE_DEPLOYMENT_DATA
  }

  const store = DeployentStore(databaseConnection)

  // map of cluster names onto database records
  const deploymentMap = {}

  async.eachSeries(data, (deploymentData, nextDeployment) => {
    const insertData = Object.assign({}, deploymentData, {
      cluster,
    })
    store.create({
      data: insertData
    }, (err, deployment) => {
      if(err) return nextDeployment(err)
      deploymentMap[deployment.name] = deployment
      nextDeployment()
    })
  }, (err) => {
    if(err) return done(err)
    done(null, deploymentMap)
  })
}

const insertTestRoles = (databaseConnection, user, data, done) => {

  if(!done) {
    done = data
    data = SIMPLE_ROLE_DATA
  }

  const store = RoleStore(databaseConnection)

  // map of resource types onto database records
  const roleMap = {}

  async.eachSeries(data, (roleData, nextRole) => {
    const insertData = Object.assign({}, roleData, {
      user,
    })
    store.create({
      data: insertData
    }, (err, role) => {
      if(err) return nextRole(err)
      roleMap[role.resource_type] = role
      nextRole()
    })
  }, (err) => {
    if(err) return done(err)
    done(null, roleMap)
  })
}

const insertTestTasks = (databaseConnection, user, data, done) => {

  if(!done) {
    done = data
    data = SIMPLE_TASK_DATA
  }

  const store = TaskStore(databaseConnection)

  // map of resource types onto database records
  const taskMap = {}

  async.eachSeries(data, (taskData, nextTask) => {
    const insertData = Object.assign({}, taskData, {
      user,
    })
    store.create({
      data: insertData
    }, (err, task) => {
      if(err) return nextTask(err)
      taskMap[task.id] = task
      nextTask()
    })
  }, (err) => {
    if(err) return done(err)
    done(null, taskMap)
  })
}

module.exports = {
  SIMPLE_USER_DATA,
  SIMPLE_CLUSTER_DATA,
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