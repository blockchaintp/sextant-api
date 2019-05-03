'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const TaskStore = require('../../src/store/task')
const config = require('../../src/config')

const {
  RESOURCE_TYPES,
  PERMISSION_USER,
  TASK_STATUS,
} = config

database.testSuiteWithDatabase(getConnection => {

  let taskMap = {}
  let userMap = {}

  tape('task store -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), tools.errorWrapper(t, (users) => {
      userMap = users
      t.end()
    }))
  
  })

  tape('task store -> list no data', (t) => {

    const store = TaskStore(getConnection())
  
    store.list({}, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, 0, `there were no tasks`)
      t.end()
    }))
    
  })

  tape('task store -> create with missing values', (t) => {

    const store = TaskStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      user: userMap[PERMISSION_USER.admin].id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
      restartable: true,
      payload: {
        apples: 10,
      },
    })
  })

  tape('task store -> create tasks for admin user', (t) => {

    fixtures.insertTestTasks(getConnection(), userMap[PERMISSION_USER.admin].id, tools.errorWrapper(t, (tasks) => {
      taskMap = tasks
      t.end()
    }))
  })

  tape('task store -> create tasks for write user', (t) => {

    const insertData = fixtures.SIMPLE_TASK_DATA.map(task => {
      return Object.assign({}, task, {
        resource_id: task.resource_id + 10,
      })
    })
    fixtures.insertTestTasks(getConnection(), userMap[PERMISSION_USER.user].id, insertData, tools.errorWrapper(t, (tasks) => {
      Object.keys(tasks).forEach(key => {
        taskMap[key] = tasks[key]
      })
      t.end()
    }))
  })

  tape('task store -> list all', (t) => {

    const store = TaskStore(getConnection())

    // we inserted each set of tasks for 2 users
    const expectedCount = fixtures.SIMPLE_TASK_DATA.length * 2

    store.list({}, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, expectedCount, `there were ${expectedCount} tasks`)
      t.end()
    }))
    
  })


  tape('task store -> list by cluster', (t) => {

    const store = TaskStore(getConnection())

    store.list({
      cluster: 10,
    }, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, 1, `there was 1 task`)
      t.equal(tasks[0].resource_type, RESOURCE_TYPES.cluster, `the resource_type is correct`)
      t.equal(tasks[0].resource_id, 10, `the resource_id is correct`)
      t.end()
    }))
    
  })
  
  tape('task store -> list by deployment', (t) => {

    const store = TaskStore(getConnection())

    store.list({
      deployment: 11,
    }, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, 1, `there was 1 task`)
      t.equal(tasks[0].resource_type, RESOURCE_TYPES.deployment, `the resource_type is correct`)
      t.equal(tasks[0].resource_id, 11, `the resource_id is correct`)
      t.end()
    }))
    
  })

  tape('task store -> list by user', (t) => {

    const store = TaskStore(getConnection())

    const expectedCount = fixtures.SIMPLE_TASK_DATA.length
    const userId = userMap[PERMISSION_USER.admin].id

    store.list({
      user: userId,
    }, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, expectedCount, `there were ${expectedCount} tasks`)
      t.deepEqual(tasks.map(task => task.user), [userId, userId], `the user ids are correct`)
      t.end()
    }))
    
  })


  tape('task store -> get', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.get({
      id: ids[0],
    }, tools.errorWrapper(t, (task) => {
      t.deepEqual(task, taskMap[ids[0]], `the returned task is correct`)
      t.end()
    }))
    
  })

  tape('task store -> update bad status', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.update({
      id: ids[0],
      data: {
        status: 'apples'
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('task store -> update status', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.update({
      id: ids[0],
      data: {
        status: TASK_STATUS.running,
      }
    }, tools.errorWrapper(t, (task) => {
      store.get({
        id: ids[0],
      }, tools.errorWrapper(t, (task) => {
        t.equal(task.status, TASK_STATUS.running, `the updated status is ok`)
        t.end()
      }))
    }))
    
  })

  tape('task store -> activeForResource', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap).map(i => parseInt(i))

    store.activeForResource({
      cluster: 10,
    }, tools.errorWrapper(t, (tasks) => {
      t.equal(tasks.length, 1, `there was 1 task`)
      t.deepEqual(tasks.map(task => task.resource_type), [RESOURCE_TYPES.cluster], `the resource_types are correct`)
      t.deepEqual(tasks.map(task => task.id), [ids[0]], `the resource_ids are correct`)
      t.deepEqual(tasks.map(task => task.resource_id), [10], `the resource_ids are correct`)
      t.end()
    }))
    
  })

})