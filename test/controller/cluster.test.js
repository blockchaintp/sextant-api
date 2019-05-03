'use strict'

const async = require('async')
const tape = require('tape')
const database = require('../database')
const fixtures = require('../fixtures')
const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')

const TaskProcessor = require('../taskProcessor')

const config = require('../../src/config')

const {
  PERMISSION_USER,
  CLUSTER_PROVISION_TYPE,
  PERMISSION_ROLE,
  RESOURCE_TYPES,
  TASK_STATUS,
  TASK_ACTION,
  TASK_CONTROLLER_LOOP_DELAY,
} = config

database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return ClusterController({
      store,
    })
  }

  let userMap = {}
  let testClusters = {}

  tape('cluster controller -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
  
  })
/*
  tape('cluster controller -> create cluster for admin user', (t) => {
  
    const controller = getController()
    const store = Store(getConnection())

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    let testCluster = null
    const testUser = userMap[PERMISSION_USER.admin]

    async.series([

      // insert the cluster
      next => {
        controller.create({
          user: testUser,
          data: clusterData,
        }, (err, cluster) => {
          if(err) return next(err)
          t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
          t.deepEqual(cluster.desired_state, clusterData.desired_state, `the cluster desired_state is correct`)
          testClusters[PERMISSION_USER.admin] = testCluster = cluster
          next()
        })
      },

      // check we have a user writable role for the cluster
      next => {
        store.role.get({
          user: testUser.id,
          resource_type: RESOURCE_TYPES.cluster,
          resource_id: testCluster.id,
        }, (err, role) => {
          if(err) return next(err)
          t.equal(role.user, testUser.id, `the role user id is correct`)
          t.equal(role.resource_type, RESOURCE_TYPES.cluster, `the role resource_type is correct`)
          t.equal(role.resource_id, testCluster.id, `the role resource_id is correct`)
          next()
        })
      },

      // check we have a task for the cluster.create
      next => {
        store.task.list({
          cluster: testCluster.id
        }, (err, tasks) => {
          if(err) return next(err)
          t.equal(tasks.length,1, `there is a create task`)
          const task = tasks[0]
          t.equal(task.user, testUser.id, `the task resource_type is correct`)
          t.equal(task.resource_type, RESOURCE_TYPES.cluster, `the task resource_type is correct`)
          t.equal(task.resource_id, testCluster.id, `the task resource_id is correct`)
          t.equal(task.status, TASK_STATUS.created, `the task status is correct`)
          t.equal(task.restartable, true, `the task restartable is correct`)
          t.equal(task.action, TASK_ACTION['cluster.create'], `the task payload action is correct`)
          next()
        })
      },

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('cluster controller -> get roles for created cluster', (t) => {
  
    const testUser = userMap[PERMISSION_USER.admin]
    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    controller.getRoles({
      id: createdCluster.id,
    }, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.length, 1, `there was a single role`)
      t.equal(roles[0].resource_type, 'cluster', `the role resource_type was correct`)
      t.equal(roles[0].resource_id, createdCluster.id, `the role resource_id was correct`)
      t.equal(roles[0].user, testUser.id, `the role user was correct`)
      t.equal(roles[0].userRecord.id, testUser.id, `there was a userRecord in the role`)
      t.end()
    })
  })

  tape('cluster controller -> create additional role for created cluster', (t) => {
    const normalUser = userMap[PERMISSION_USER.user]

    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    controller.createRole({
      id: createdCluster.id,
      user: normalUser.id,
      permission: PERMISSION_ROLE.write,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster controller -> get roles for created cluster', (t) => {
  
    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    controller.getRoles({
      id: createdCluster.id,
    }, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.length, 2, `there were two roles`)    
      t.end()
    })
  })

  tape('cluster controller -> delete additional role for created cluster', (t) => {
    const normalUser = userMap[PERMISSION_USER.user]

    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    controller.deleteRole({
      id: createdCluster.id,
      user: normalUser.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster controller -> get roles for created cluster', (t) => {
  
    const controller = getController()

    const createdCluster = testClusters[PERMISSION_USER.admin]
    
    controller.getRoles({
      id: createdCluster.id,
    }, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.length, 1, `there were one roles`)    
      t.end()
    })
  })

  tape('cluster controller -> cannot update a cluster with a running task', (t) => {

    const controller = getController()

    const desired_state = Object.assign({}, fixtures.SIMPLE_CLUSTER_DATA[0])
    desired_state.oranges = 11

    controller.update({
      user: userMap[PERMISSION_USER.admin],
      id: testClusters[PERMISSION_USER.admin].id,
      data: {
        desired_state,
      },
    }, (err, cluster) => {
      t.ok(err, `there was an error`)
      t.equal(err, `there are active tasks for this cluster`)
      t.end()
    })
  })

  tape('cluster controller -> update task', (t) => {

    const store = Store(getConnection())

    async.waterfall([
      (next) => store.task.list({
        cluster: testClusters[PERMISSION_USER.admin].id
      }, next),

      (tasks, next) => store.task.update({
        id: tasks[0].id,
        data: {
          status: TASK_STATUS.finished,
        }
      }, next)

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('cluster controller -> update a cluster', (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const desired_state = Object.assign({}, fixtures.SIMPLE_CLUSTER_DATA[0].desired_state, {
      oranges: 11,
    })

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    async.series([
      next => {
        controller.update({
          user: testUser,
          id: testCluster.id,
          data: {
            desired_state,
          },
        }, (err, cluster) => {
          if(err) return next(err)
          t.deepEqual(cluster.desired_state, desired_state, `the desired_state is correct`)
          next()
        })
      },

      next => {
        store.task.list({
          cluster: testCluster.id
        }, (err, tasks) => {
          if(err) return next(err)
          t.equal(tasks.length,2, `there are 2 tasks`)
          t.deepEqual(tasks.map(task => task.status), [TASK_STATUS.created, TASK_STATUS.finished], `the tasks are correct`)
          t.equal(tasks[0].action, TASK_ACTION['cluster.update'], `the new task has the correct type`)
          next()
        })
      },
    ], (err) => {
      t.notok(err, `there as no error`)
      t.end()
    })
    
  })

  tape('cluster controller -> create cluster for superuser user', (t) => {
  
    const controller = getController()
    
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]
    const testUser = userMap[PERMISSION_USER.superuser]

    controller.create({
      user: testUser,
      data: clusterData,
    }, (err, cluster) => {
      t.notok(err, `there was no error`)
      t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
      t.deepEqual(cluster.desired_state, clusterData.desired_state, `the cluster desired_state is correct`)
      testClusters[PERMISSION_USER.superuser] = cluster
      t.end()
    })
 
  })

  tape('cluster controller -> get cluster', (t) => {
  
    const controller = getController()

    const testCluster = testClusters[PERMISSION_USER.superuser]

    controller.get({
      id: testCluster.id,
    }, (err, cluster) => {
      t.notok(err, `there was no error`)
      t.equal(cluster.name, testCluster.name, `the cluster name is correct`)
      t.deepEqual(cluster.desired_state, testCluster.desired_state, `the cluster desired_state is correct`)
      t.end()
    })
 
  })

  tape('cluster controller -> list clusters for superuser user', (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.superuser]

    controller.list({
      user: testUser,
    }, (err, clusters) => {
      t.notok(err, `there was no error`)
      t.equal(clusters.length, 2, `there are 2 clusters`)
      t.end()
    })
  })

  tape('cluster controller -> list clusters for admin user', (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.admin]

    controller.list({
      user: testUser,
    }, (err, clusters) => {
      t.notok(err, `there was no error`)
      t.equal(clusters.length, 1, `there is 1 cluster`)
      t.end()
    })
  })

  tape('cluster controller -> list clusters for normal user', (t) => {

    const controller = getController()

    const testUser = userMap[PERMISSION_USER.user]

    controller.list({
      user: testUser,
    }, (err, clusters) => {
      t.notok(err, `there was no error`)
      t.equal(clusters.length, 0, `there are no clusters`)
      t.end()
    })
  })

  tape('cluster controller -> list clusters for no user', (t) => {

    const controller = getController()
    
    controller.list({

    }, (err, clusters) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('cluster controller -> cannot delete a cluster with a running task', (t) => {

    const controller = getController()

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    controller.delete({
      user: testUser,
      id: testCluster.id,
    }, (err, cluster) => {
      t.ok(err, `there was an error`)
      t.equal(err, `there are active tasks for this cluster`)
      t.end()
    })
  })

  tape('cluster controller -> update task', (t) => {

    const store = Store(getConnection())

    const testCluster = testClusters[PERMISSION_USER.admin]

    async.waterfall([
      (next) => store.task.list({
        cluster: testCluster.id
      }, next),

      (tasks, next) => {
        store.task.update({
          id: tasks[0].id,
          data: {
            status: TASK_STATUS.finished,
          }
        }, next)
      },

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('cluster controller -> delete a cluster', (t) => {

    const controller = getController()
    const store = Store(getConnection())

    const testCluster = testClusters[PERMISSION_USER.admin]
    const testUser = userMap[PERMISSION_USER.admin]

    async.series([
      next => {
        controller.delete({
          user: testUser,
          id: testCluster.id,
        }, (err, cluster) => {
          if(err) return next(err)
          next()
        })
      },

      next => {
        store.task.list({
          cluster: testCluster.id
        }, (err, tasks) => {
          if(err) return next(err)
          t.equal(tasks.length, 3, `there are 3 tasks`)
          t.deepEqual(tasks.map(task => task.status), [
            TASK_STATUS.created,
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
      t.notok(err, `there as no error`)
      t.end()
    })
  })
*/

  tape('cluster controller -> create remote cluster with secrets and update the secrets', (t) => {
    
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

    taskProcessor.start()

    const TOKEN = 'apples'
    const CA = 'oranges'

    const TOKEN2 = 'pears'
    const CA2 = 'peaches'

    const clusterData = {
      name: 'remote_cluster_with_secrets',
      provision_type: CLUSTER_PROVISION_TYPE.remote,
      desired_state: {
        apiServer: 'http://localhost',
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

      // insert the cluster
      next => {
        controller.create({
          user: testUser,
          data: clusterData,
        }, (err, cluster) => {
          if(err) return next(err)
          t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
          context.token = cluster.desired_state.token
          context.ca = cluster.desired_state.ca
          context.cluster = cluster
          next()
        })
      },

      next => {
        async.parallel({
          token: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.token,
          }, nextp),
          ca: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.ca,
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

          t.equal(cluster.desired_state.token, context.token, `the desired_state token id is the same`)
          t.equal(cluster.desired_state.ca, context.ca, `the desired_state ca id is the same`)
          t.equal(cluster.applied_state.token, context.token, `the applied_state token id is the same`)
          t.equal(cluster.applied_state.ca, context.ca, `the applied_state ca id is the same`)
          
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
              apiServer: 'http://localhost',
              token: TOKEN2,
              ca: CA2,
            },
          },
        }, (err, cluster) => {
          if(err) return next(err)
          context.token2 = cluster.desired_state.token
          context.ca2 = cluster.desired_state.ca
          context.cluster = cluster

          console.log('--------------------------------------------')
          console.log('--------------------------------------------')
          console.dir(cluster)
          next()
        })
      },

      next => {
        async.parallel({
          token: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.token,
          }, nextp),
          ca: nextp => store.clustersecret.get({
            cluster: context.cluster.id,
            id: context.cluster.desired_state.ca,
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

          t.equal(cluster.desired_state.token, context.token2, `the desired_state token id is the same`)
          t.equal(cluster.desired_state.ca, context.ca2, `the desired_state ca id is the same`)
          t.equal(cluster.applied_state.token, context.token2, `the applied_state token id is the same`)
          t.equal(cluster.applied_state.ca, context.ca2, `the applied_state ca id is the same`)
          
          next()
        })
      },

    ], (err) => {
      taskProcessor.stop(() => {
        t.notok(err, `there was no error`)
        t.end()
      })
    })
  })
  
})