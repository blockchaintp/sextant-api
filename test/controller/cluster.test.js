'use strict'

const Promise = require('bluebird')
const asyncTest = require('../asyncTest')
const asyncTestError = require('../asyncTestError')
const database = require('../database')
const fixtures = require('../fixtures')
const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')
const base64 = require('../../src/utils/base64')

const TaskProcessor = require('../../src/taskprocessor')

const config = require('../../src/config')

const errorClusters = require('../fixtures/errorClusters')

const {
  PERMISSION_USER,
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS,
  PERMISSION_ROLE,
  RESOURCE_TYPES,
  TASK_STATUS,
  TASK_ACTION,
  TASK_CONTROLLER_LOOP_DELAY,
} = config


// remove the ca and token from the desired state as these will be replaced by clustersecret ids
// this is so we can compare two values (ignoring the ca and token)
const cleanDesiredState = (state) => {
  const ret = Object.assign({}, state)
  delete(ret.ca)
  delete(ret.token)
  delete(ret.ca_id)
  delete(ret.token_id)
  return ret
}

database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return ClusterController({
      store,
    })
  }

  let userMap = {}
  let testClusters = {}

  asyncTest('cluster controller -> create users', async (t) => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
  })

  asyncTest('cluster controller -> create cluster with bad values', async (t) => {
  
    const controller = getController()
    const testUser = userMap[PERMISSION_USER.admin]

    await Promise.each(Object.keys(errorClusters), async type => {
      const {
        values,
        error,
      } = errorClusters[type]

      let checkError = null

      try {
        await controller.create({
          user: testUser,
          data: values,
        })
      } catch(err) {
        checkError = err 
      }
      t.equal(checkError.toString(), `Error: ${error}`, `the error was correct for ${type}`)
    })
  })

  asyncTest('cluster controller -> create cluster for admin user', async (t) => {
  
    const controller = getController()
    const store = Store(getConnection())

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    const testUser = userMap[PERMISSION_USER.admin]

    const createTask = await controller.create({
      user: testUser,
      data: clusterData,
    })

    const cluster = await store.cluster.get({
      id: createTask.resource_id,
    })

    const role = await store.role.get({
      user: testUser.id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: cluster.id,
    })

    const tasks = await store.task.list({
      cluster: cluster.id
    })

    testClusters[PERMISSION_USER.admin] = cluster
    const task = tasks[0]

    t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
    t.deepEqual(cleanDesiredState(cluster.desired_state), cleanDesiredState(clusterData.desired_state), `the cluster desired_state is correct`)

    t.equal(role.user, testUser.id, `the role user id is correct`)
    t.equal(role.resource_type, RESOURCE_TYPES.cluster, `the role resource_type is correct`)
    t.equal(role.resource_id, cluster.id, `the role resource_id is correct`)

    t.equal(tasks.length,1, `there is a create task`)
    t.equal(task.user, testUser.id, `the task resource_type is correct`)
    t.equal(task.resource_type, RESOURCE_TYPES.cluster, `the task resource_type is correct`)
    t.equal(task.resource_id, cluster.id, `the task resource_id is correct`)
    t.equal(task.status, TASK_STATUS.created, `the task status is correct`)
    t.equal(task.restartable, true, `the task restartable is correct`)
    t.equal(task.action, TASK_ACTION['cluster.create'], `the task payload action is correct`)
 
  })

  asyncTest('cluster controller -> create cluster with the same name', async (t) => {
  
    const controller = getController()

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]
    const testUser = userMap[PERMISSION_USER.admin]

    let error = null

    try{
      await controller.create({
        user: testUser,
        data: clusterData,
      })
    } catch(err) {
      error = err
    }

    t.ok(error, `there was an error`)
    t.equal(error.toString(), `Error: there is already a cluster with the name ${clusterData.name}`)
  })

  asyncTest('cluster controller -> get roles for created cluster', async (t) => {
  
    const testUser = userMap[PERMISSION_USER.admin]
    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    const roles = await controller.getRoles({
      id: createdCluster.id,
    })
    t.equal(roles.length, 1, `there was a single role`)
    t.equal(roles[0].resource_type, 'cluster', `the role resource_type was correct`)
    t.equal(roles[0].resource_id, createdCluster.id, `the role resource_id was correct`)
    t.equal(roles[0].user, testUser.id, `the role user was correct`)
    t.equal(roles[0].userRecord.id, testUser.id, `there was a userRecord in the role`)
  })

  asyncTest('cluster controller -> create additional role for created cluster', async (t) => {
    const normalUser = userMap[PERMISSION_USER.user]

    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    await controller.createRole({
      id: createdCluster.id,
      user: normalUser.id,
      permission: PERMISSION_ROLE.write,
    })

    const roles = await controller.getRoles({
      id: createdCluster.id,
    })

    t.equal(roles.length, 2, `there were two roles`)    

    await controller.deleteRole({
      id: createdCluster.id,
      user: normalUser.id,
    })

    const rolesAfterDelete = await controller.getRoles({
      id: createdCluster.id,
    })

    t.equal(rolesAfterDelete.length, 1, `there was one role`)    
  })

  asyncTest('cluster controller -> cannot update a cluster with a running task', async (t) => {

    const controller = getController()

    const desired_state = Object.assign({}, fixtures.SIMPLE_CLUSTER_DATA[0])
    desired_state.oranges = 11

    let error = null

    try {
      await controller.update({
        user: userMap[PERMISSION_USER.admin],
        id: testClusters[PERMISSION_USER.admin].id,
        data: {
          desired_state,
        },
      })
    } catch(err) {
      error = err
    }

    t.ok(error, `there was an error`)
    t.equal(error.toString(), `Error: there are active tasks for this cluster`)
  })

  
  asyncTest('cluster controller -> update task', async (t) => {

    const store = Store(getConnection())

    const tasks = await store.task.list({
      cluster: testClusters[PERMISSION_USER.admin].id
    })

    await store.task.update({
      id: tasks[0].id,
      data: {
        status: TASK_STATUS.finished,
      }
    })    
  })

  asyncTest('cluster controller -> update a cluster', async (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const desired_state = Object.assign({}, fixtures.SIMPLE_CLUSTER_DATA[0].desired_state, {
      oranges: 11,
    })

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    await controller.update({
      user: testUser,
      id: testCluster.id,
      data: {
        desired_state,
        shouldNotBeInserted: true,
      },
    })

    const cluster = await store.cluster.get({
      id: testCluster.id,
    })

    t.deepEqual(cleanDesiredState(cluster.desired_state), cleanDesiredState(desired_state), `the desired_state is correct`)
    t.notok(cluster.shouldNotBeInserted, `there was no extra value inserted`)

    const tasks = await store.task.list({
      cluster: testCluster.id
    })

    t.equal(tasks.length,2, `there are 2 tasks`)
    t.deepEqual(tasks.map(task => task.status), [TASK_STATUS.created, TASK_STATUS.finished], `the tasks are correct`)
    t.equal(tasks[0].action, TASK_ACTION['cluster.update'], `the new task has the correct type`)
    
  })
  
  asyncTest('cluster controller -> create cluster for superuser user', async (t) => {
  
    const controller = getController()
    const store = Store(getConnection())
    
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]
    const testUser = userMap[PERMISSION_USER.superuser]

    const createTask = await controller.create({
      user: testUser,
      data: clusterData,
    })

    const cluster = await store.cluster.get({
      id: createTask.resource_id,
    })
    t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
    t.deepEqual(cleanDesiredState(cluster.desired_state), cleanDesiredState(clusterData.desired_state), `the cluster desired_state is correct`)
    testClusters[PERMISSION_USER.superuser] = cluster
  })

  asyncTest('cluster controller -> get cluster', async (t) => {
  
    const controller = getController()

    const testCluster = testClusters[PERMISSION_USER.superuser]

    const cluster = await controller.get({
      id: testCluster.id,
    })
    t.equal(cluster.name, testCluster.name, `the cluster name is correct`)
    t.deepEqual(cleanDesiredState(cluster.desired_state), cleanDesiredState(testCluster.desired_state), `the cluster desired_state is correct`)
  })

  asyncTest('cluster controller -> get cluster with task', async (t) => {
  
    const controller = getController()

    const testCluster = testClusters[PERMISSION_USER.superuser]

    const cluster = await controller.get({
      id: testCluster.id,
      withTask: true,
    })

    t.equal(typeof(cluster.task), 'object', 'the task was returned with the cluster')
  })

  asyncTest('cluster controller -> list clusters for superuser user', async (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.superuser]

    const clusters = await controller.list({
      user: testUser,
    })
    t.equal(clusters.length, 2, `there are 2 clusters`)
  })

  asyncTest('cluster controller -> list clusters for admin user', async (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.admin]

    const clusters = await controller.list({
      user: testUser,
    })
    t.equal(clusters.length, 1, `there is 1 cluster`)
  })

  asyncTest('cluster controller -> list clusters for normal user', async (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.user]

    const clusters = await controller.list({
      user: testUser,
    })
    t.equal(clusters.length, 0, `there are no clusters`)
  })

  asyncTest('cluster controller -> list clusters for no user', async (t) => {

    const controller = getController()
    
    let error = null

    try {
      await controller.list({})
    } catch(err) {
      error = err
    }

    t.ok(error, `there was an error`)
  })

  asyncTest('cluster controller -> list clusters with tasks', async (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.admin]

    const clusters = await controller.list({
      user: testUser,
      withTasks: true,
    })

    t.equal(typeof(clusters[0].task), 'object', `there is a task returned with the cluster`)
  })

  asyncTest('cluster controller -> cannot delete a cluster with a running task', async (t) => {

    const controller = getController()

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    let error = null 

    try {
      await controller.delete({
        user: testUser,
        id: testCluster.id,
      })
    } catch(err) {
      error = err
    }

    t.ok(error, `there was an error`)
    t.equal(error.toString(), `Error: there are active tasks for this cluster`)
  })

  
  asyncTest('cluster controller -> update task', async (t) => {

    const store = Store(getConnection())

    const testCluster = testClusters[PERMISSION_USER.admin]

    const tasks = await store.task.list({
      cluster: testCluster.id
    })

    await store.task.update({
      id: tasks[0].id,
      data: {
        status: TASK_STATUS.finished,
      }
    })
  })

  asyncTest('cluster controller -> delete a cluster', async (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    const taskProcessor = TaskProcessor({
      store,
      handlers: {
        [TASK_ACTION['cluster.create']]: function* (params) {
          
        },
        [TASK_ACTION['cluster.update']]: function* (params) {
          
        },
        [TASK_ACTION['cluster.delete']]: function* (params) {
          yield store.cluster.update({
            id: params.task.resource_id,
            data: {
              status: CLUSTER_STATUS.deleted,
            },
          })
        },
      }
    })

    await taskProcessor.start()

    const clusters = await controller.list({
      user: testUser,
      id: testCluster.id,
    })

    await controller.delete({
      user: testUser,
      id: testCluster.id,
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const newClusters = await controller.list({
      user: testUser,
      id: testCluster.id,
    })

    t.equal(newClusters.length, clusters.length - 1, `there is one less cluster in the list`)

    const tasks = await store.task.list({
      cluster: testCluster.id
    })

    t.equal(tasks.length, 3, `there are 3 tasks`)
    t.deepEqual(tasks.map(task => task.status), [
      TASK_STATUS.finished,
      TASK_STATUS.finished,
      TASK_STATUS.finished
    ], `the task statuses are correct`)
    t.deepEqual(tasks.map(task => task.action), [
      TASK_ACTION['cluster.delete'],
      TASK_ACTION['cluster.update'],
      TASK_ACTION['cluster.create']
    ], `the task actions are correct`)

    await taskProcessor.stop()
  })

  asyncTest('cluster controller -> create remote cluster with secrets and update the secrets', async (t) => {
    
    const controller = getController()
    const store = Store(getConnection())

    function* saveAppliedState(params) {
      const cluster = yield params.store.cluster.get({
        id: params.task.resource_id,
      })

      yield params.store.cluster.update({
        id: cluster.id,
        data: {
          applied_state: cluster.desired_state,
        }
      })
    }

    const taskProcessor = TaskProcessor({
      store,
      handlers: {
        [TASK_ACTION['cluster.create']]: saveAppliedState,
        [TASK_ACTION['cluster.update']]: saveAppliedState,
      }
    })

    const TOKEN = 'apples'
    const CA = '-----BEGIN CERTIFICATE-----Oranges-----END CERTIFICATE-----'

    const TOKEN2 = 'pears'
    const CA2 = '-----BEGIN CERTIFICATE-----peaches-----END CERTIFICATE-----'

    const API_SERVER = 'http://localhost.com'

    const clusterData = {
      name: 'remote_cluster_with_secrets',
      provision_type: CLUSTER_PROVISION_TYPE.remote,
      desired_state: {
        apiServer: API_SERVER,
        token: TOKEN,
        ca: CA,
      },
      capabilities: {
        funkyFeature: true,
      },
    }

    const testUser = userMap[PERMISSION_USER.admin]

    const context = {}

    await taskProcessor.start()

    const createTask = await controller.create({
      user: testUser,
      data: clusterData,
    })

    const cluster = await store.cluster.get({
      id: createTask.resource_id,
    })

    testClusters.withSecrets = cluster

    const {
      token_id,
      ca_id,
    } = cluster.desired_state

    t.equal(cluster.name, clusterData.name, `the cluster name is correct`)

    const token = await store.clustersecret.get({
      cluster: cluster.id,
      id: token_id,
    })

    const ca = await store.clustersecret.get({
      cluster: cluster.id,
      id: ca_id,
    })

    t.equal(token.name, 'token', 'the token secret name is correct')
    t.equal(token.base64data, base64.encode(TOKEN), 'the token secret value is correct')
    t.equal(ca.name, 'ca', 'the ca secret name is correct')
    t.equal(ca.base64data, base64.encode(CA), 'the ca secret value is correct')

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    await controller.update({
      id: cluster.id,
      user: testUser,
      data: {
        name: 'my new name',
      },
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const updatedNameCluster = await store.cluster.get({
      id: cluster.id,
    })

    t.equal(updatedNameCluster.desired_state.apiServer, cluster.desired_state.apiServer, `the cluster api server is the same`)
    t.equal(updatedNameCluster.name, 'my new name', `the cluster name is correct`)
    t.equal(updatedNameCluster.desired_state.token_id, token_id, `the desired_state token id is the same`)
    t.equal(updatedNameCluster.desired_state.ca_id, ca_id, `the desired_state ca id is the same`)

    await controller.update({
      id: cluster.id,
      user: testUser,
      data: {
        desired_state: {
          apiServer: API_SERVER,
          token: TOKEN2,
          ca: CA2,
        },
      },
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const updatedSecretsCluster = await store.cluster.get({
      id: cluster.id,
    })

    const token_id2 = updatedSecretsCluster.desired_state.token_id
    const ca_id2 = updatedSecretsCluster.desired_state.ca_id

    const token2 = await store.clustersecret.get({
      cluster: cluster.id,
      id: token_id2,
    })

    const ca2 = await store.clustersecret.get({
      cluster: cluster.id,
      id: ca_id2,
    })

    t.equal(token2.name, 'token', 'the token secret name is correct')
    t.equal(token2.base64data, base64.encode(TOKEN2), 'the token secret value is correct')
    t.equal(ca2.name, 'ca', 'the ca secret name is correct')
    t.equal(ca2.base64data, base64.encode(CA2), 'the ca secret value is correct')

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    await controller.update({
      id: cluster.id,
      user: testUser,
      data: {
        name: 'my new name2',
      },
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const updatedNameCluster2 = await store.cluster.get({
      id: cluster.id,
    })

    t.equal(updatedNameCluster2.name, 'my new name2', `the cluster name is correct`)
    t.equal(updatedNameCluster2.desired_state.token_id, token_id2, `the desired_state token id is the same`)
    t.equal(updatedNameCluster2.desired_state.ca_id, ca_id2, `the desired_state ca id is the same`)

    await taskProcessor.stop()

  })

  asyncTestError('cluster controller -> fail to delete the cluster permenantly', async (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const testUser = userMap[PERMISSION_USER.admin]

    const testCluster = testClusters.withSecrets

    await controller.deletePermenantly({
      id: testCluster.id,
      user: testUser,
    })
  })

  asyncTest('cluster controller -> delete the cluster permenantly', async (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const taskProcessor = TaskProcessor({
      store,
      handlers: {
        [TASK_ACTION['cluster.delete']]: function* (params) {},
      }
    })


    const testUser = userMap[PERMISSION_USER.admin]

    const testCluster = testClusters.withSecrets

    await taskProcessor.start()

    await controller.delete({
      id: testCluster.id,
      user: testUser,
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    await controller.deletePermenantly({
      id: testCluster.id,
      user: testUser,
    })

    const secrets = await store.clustersecret.list({
      cluster: testCluster.id,
    })

    const files = await store.clusterfile.list({
      cluster: testCluster.id,
    })

    const tasks = await store.task.list({
      cluster: testCluster.id,
    })

    const roles = await store.role.listForResource({
      resource_type: 'cluster',
      resource_id: testCluster.id,
    })

    const cluster = await store.cluster.get({
      id: testCluster.id,
    })

    t.equal(secrets.length, 0, `there are no secrets`)
    t.equal(files.length, 0, `there are no files`)
    t.equal(tasks.length, 0, `there are no tasks`)
    t.equal(roles.length, 0, `there are no roles`)
    t.equal(secrets.length, 0, `there are no secrets`)

    t.notok(cluster, `there was no cluster`)

    await taskProcessor.stop()
  })
  
})