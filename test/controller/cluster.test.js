'use strict'

const Promise = require('bluebird')
const async = require('async')
const tape = require('tape')
const asyncTest = require('../asyncTest')
const database = require('../database')
const fixtures = require('../fixtures')
const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')

const TaskProcessor = require('../taskProcessor')

const config = require('../../src/config')
const tools = require('../tools')

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

    const cluster = await controller.create({
      user: testUser,
      data: clusterData,
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

    const cluster = await controller.update({
      user: testUser,
      id: testCluster.id,
      data: {
        desired_state,
        shouldNotBeInserted: true,
      },
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
    
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]
    const testUser = userMap[PERMISSION_USER.superuser]

    const cluster = await controller.create({
      user: testUser,
      data: clusterData,
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
/*
  asyncTest('cluster controller -> delete a cluster', async (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    const taskProcessor = TaskProcessor({
      store,
      handlers: {
        [TASK_ACTION['cluster.delete']]: (params, done) => {
          store.cluster.update({
            id: params.task.resource_id,
            data: {
              status: CLUSTER_STATUS.deleted,
            },
          }, done)
        },
      }
    })

    const context = {}

    async.series([

      next => taskProcessor.start(next),

      next => controller.list({
        user: testUser,
        id: testCluster.id,
      }, (err, clusters) => {
        if(err) return next(err)
        context.clusterCount = clusters.length
        next()
      }),

      next => controller.delete({
        user: testUser,
        id: testCluster.id,
      }, next),

      // wait for the task processor
      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      next => controller.list({
        user: testUser,
        id: testCluster.id,
      }, (err, clusters) => {
        if(err) return next(err)
        t.equal(clusters.length, context.clusterCount - 1, `there is one less cluster in the list`)
        next()
      }),
      
      next => {
        store.task.list({
          cluster: testCluster.id
        }, (err, tasks) => {
          if(err) return next(err)
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
          next()
        })
      },
    ], (err) => {
      t.notok(err, `there was no error`)
      taskProcessor.stop(() => {
        t.end()
      })
    })
  })

  asyncTest('cluster controller -> create remote cluster with secrets and update the secrets', async (t) => {
    
    const controller = getController()
    const store = Store(getConnection())

    const saveAppliedState = (params, done) => {
      async.waterfall([
        (next) => params.store.cluster.get({
          id: params.task.resource_id,
        }, next),

        (cluster, next) => {
          store.cluster.update({
            id: cluster.id,
            data: {
              applied_state: cluster.desired_state,
            }
          }, next)
        }
      ], done)
    }

    const taskProcessor = TaskProcessor({
      store,
      handlers: {
        [TASK_ACTION['cluster.create']]: saveAppliedState,
        [TASK_ACTION['cluster.update']]: saveAppliedState,
      }
    })

    const TOKEN = 'apples'
    const CA = 'oranges'

    const TOKEN2 = 'pears'
    const CA2 = 'peaches'

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

    async.series([

      next => taskProcessor.start(next),

      // insert the cluster
      next => {
        controller.create({
          user: testUser,
          data: clusterData,
        }, (err, cluster) => {
          if(err) return next(err)
          t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
          context.token_id = cluster.desired_state.token_id
          context.ca_id = cluster.desired_state.ca_id
          context.cluster = cluster
          next()
        })
      },

      next => {
        async.parallel({
          token: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.token_id,
          }, nextp),
          ca: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.ca_id,
          }, nextp),
        }, (err, results) => {
          if(err) return next(err)
          t.equal(results.token.name, 'token', 'the token secret name is correct')
          t.equal(results.token.base64data, TOKEN, 'the token secret value is correct')
          t.equal(results.ca.name, 'ca', 'the ca secret name is correct')
          t.equal(results.ca.base64data, CA, 'the ca secret value is correct')
          next()
        })
      },

      // wait for the task processor
      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      // update just the name and check we still have the same secrets
      next => {
        controller.update({
          id: context.cluster.id,
          user: testUser,
          data: {
            name: 'my new name',
          },
        }, (err, cluster) => {
          if(err) return next(err)

          t.equal(cluster.name, 'my new name', `the cluster name is correct`)

          t.equal(cluster.desired_state.token_id, context.token_id, `the desired_state token id is the same`)
          t.equal(cluster.desired_state.ca_id, context.ca_id, `the desired_state ca id is the same`)
          
          next()
        })
      },

      // update with new desired state and check we get new secrets
      next => {
        controller.update({
          id: context.cluster.id,
          user: testUser,
          data: {
            desired_state: {
              apiServer: API_SERVER,
              token: TOKEN2,
              ca: CA2,
            },
          },
        }, (err, cluster) => {
          if(err) return next(err)
          context.token_id2 = cluster.desired_state.token_id
          context.ca_id2 = cluster.desired_state.ca_id
          context.cluster = cluster
          next()
        })
      },

      next => {
        async.parallel({
          token: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.token_id,
          }, nextp),
          ca: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.ca_id,
          }, nextp),
        }, (err, results) => {
          if(err) return next(err)
          t.equal(results.token.name, 'token', 'the token secret name is correct')
          t.equal(results.token.base64data, TOKEN2, 'the token secret value is correct')
          t.equal(results.ca.name, 'ca', 'the ca secret name is correct')
          t.equal(results.ca.base64data, CA2, 'the ca secret value is correct')
          next()
        })
      },

      // wait for the task processor
      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      // update just the name and check we still have the same secrets
      next => {
        controller.update({
          id: context.cluster.id,
          user: testUser,
          data: {
            name: 'my new name2',
          },
        }, (err, cluster) => {
          if(err) return next(err)
          t.equal(cluster.name, 'my new name2', `the cluster name is correct`)

          t.equal(cluster.desired_state.token_id, context.token_id2, `the desired_state token id is the same`)
          t.equal(cluster.desired_state.ca_id, context.ca_id2, `the desired_state ca id is the same`)
          
          next()
        })
      },

    ], (err) => {
      t.notok(err, `there was no error`)
      taskProcessor.stop(() => {
        t.end()
      })
    })
  })
  */
})