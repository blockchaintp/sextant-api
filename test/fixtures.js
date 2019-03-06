'use strict'

const async = require('async')
const userUtils = require('../src/utils/user')
const UserStore = require('../src/store/user')
const ClusterStore = require('../src/store/cluster')
const DeployentStore = require('../src/store/deployment')
const RoleStore = require('../src/store/role')

const SIMPLE_USER_DATA = [{
  username: 'zebra',
  password: 'zebra1',
  role: 'admin',
},{
  username: 'apples',
  password: 'apples1',
  role: 'write',
}]

const SIMPLE_CLUSTER_DATA = [{
  name: 'testcluster',
  provision_type: 'aws_ec2',
  desired_state: {
    apples: 10,
  },
  capabilities: {
    funkyFeature: true,
  },
},{
  name: 'othercluster',
  provision_type: 'google_gke',
  desired_state: {
    oranges: 10,
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
  permission: 'read',
  resource_type: 'cluster',
  resource_id: 10,
}, {
  permission: 'write',
  resource_type: 'deployment',
  resource_id: 11,
}]

const getTestUserData = (data, done) => {
  userUtils.getPasswordHash(data.password, (err, hashed_password) => {
    if(err) return done(err)
    const userData = {
      username: data.username,
      role: data.role,
      hashed_password,
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
      store.create(data, (err, user) => {
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

const insertTestClusters = (databaseConnection, data, done) => {

  if(!done) {
    done = data
    data = SIMPLE_CLUSTER_DATA
  }

  const store = ClusterStore(databaseConnection)

  // map of cluster names onto database records
  const clusterMap = {}

  async.eachSeries(data, (clusterData, nextCluster) => {
    store.create(clusterData, (err, cluster) => {
      if(err) return nextCluster(err)
      clusterMap[cluster.name] = cluster
      nextCluster()
    })
  }, (err) => {
    if(err) return done(err)
    done(null, clusterMap)
  })
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
    store.create(insertData, (err, deployment) => {
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
    store.create(insertData, (err, role) => {
      if(err) return nextRole(err)
      roleMap[role.resource_type] = role
      nextRole()
    })
  }, (err) => {
    if(err) return done(err)
    done(null, roleMap)
  })
}

module.exports = {
  SIMPLE_USER_DATA,
  SIMPLE_CLUSTER_DATA,
  SIMPLE_DEPLOYMENT_DATA,
  SIMPLE_ROLE_DATA,
  getTestUserData,
  insertTestUsers,
  insertTestClusters,
  insertTestDeployments,
  insertTestRoles,
}