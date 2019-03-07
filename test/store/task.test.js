'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const TaskStore = require('../../src/store/task')
const enumerations = require('../../src/enumerations')

database.testSuiteWithDatabase(getConnection => {

  let taskMap = {}
  let userMap = {}

  tape('task store -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
  
  })

  tape('task store -> list no data', (t) => {

    const store = TaskStore(getConnection())
  
    store.list({}, (err, tasks) => {
      t.notok(err, `there was no error`)
      t.equal(tasks.length, 0, `there were no tasks`)
      t.end()
    })
    
  })

  tape('task store -> create with missing values', (t) => {

    const store = TaskStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      user: userMap.admin.id,
      resource_type: 'cluster',
      resource_id: 10,
      restartable: true,
      payload: {
        apples: 10,
      },
    })
  })

  tape('task store -> create tasks for admin user', (t) => {

    fixtures.insertTestTasks(getConnection(), userMap.admin.id, (err, tasks) => {
      t.notok(err, `there was no error`)
      taskMap = tasks
      t.end()
    })
  })

  tape('task store -> create tasks for write user', (t) => {

    fixtures.insertTestTasks(getConnection(), userMap.write.id, (err, tasks) => {
      t.notok(err, `there was no error`)
      Object.keys(tasks).forEach(key => {
        taskMap[key] = tasks[key]
      })
      t.end()
    })
  })

  tape('task store -> list all', (t) => {

    const store = TaskStore(getConnection())

    store.list({}, (err, tasks) => {
      t.notok(err, `there was no error`)
      t.equal(tasks.length, 4, `there were 4 tasks`)
      t.end()
    })
    
  })

  tape('task store -> list by cluster', (t) => {

    const store = TaskStore(getConnection())

    store.list({
      cluster: 10,
    }, (err, tasks) => {
      t.notok(err, `there was no error`)
      t.equal(tasks.length, 2, `there were 2 tasks`)
      t.deepEqual(tasks.map(task => task.resource_type), ['cluster', 'cluster'], `the resource_types are correct`)
      t.deepEqual(tasks.map(task => task.resource_id), [10, 10], `the resource_ids are correct`)
      t.end()
    })
    
  })

  tape('task store -> list by deployment', (t) => {

    const store = TaskStore(getConnection())

    store.list({
      deployment: 11,
    }, (err, tasks) => {
      t.notok(err, `there was no error`)
      t.equal(tasks.length, 2, `there were 2 tasks`)
      t.deepEqual(tasks.map(task => task.resource_type), ['deployment', 'deployment'], `the resource_types are correct`)
      t.deepEqual(tasks.map(task => task.resource_id), [11, 11], `the resource_ids are correct`)
      t.end()
    })
    
  })

  tape('task store -> list by user', (t) => {

    const store = TaskStore(getConnection())

    store.list({
      user: userMap.admin.id,
    }, (err, tasks) => {
      t.notok(err, `there was no error`)
      t.equal(tasks.length, 2, `there were 2 tasks`)
      t.deepEqual(tasks.map(task => task.user), [userMap.admin.id, userMap.admin.id], `the user ids are correct`)
      t.end()
    })
    
  })

  tape('task store -> get', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.get({
      id: ids[0],
    }, (err, task) => {
      t.notok(err, `there was no error`)
      t.deepEqual(task, taskMap[ids[0]], `the returned task is correct`)
      t.end()
    })
    
  })

  tape('task store -> update status', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.update({
      id: ids[0],
      data: {
        status: 'running'
      }
    }, (err, task) => {
      t.notok(err, `there was no error`)
      store.get({
        id: ids[0],
      }, (err, task) => {
        t.notok(err, `there was no error`)
        t.equal(task.status, 'running', `the updated status is ok`)
        t.end()
      })
    })
    
  })

  tape('task store -> update bad status', (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    store.update({
      id: ids[0],
      data: {
        status: 'apples'
      }
    }, (err, task) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })
})