'use strict'

const tape = require('tape')
const async = require('async')

const Store = require('../src/store')
const TaskProcessor = require('../src/taskprocessor')
const config = require('../src/config')

const database = require('./database')
const fixtures = require('./fixtures')

const {
  PERMISSION_USER,
  RESOURCE_TYPES,
  TASK_ACTION,
} = config

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}

  tape('task store -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
  
  })

  tape('task processor -> test create cluster task', (t) => {

    const store = Store(getConnection())
    
    const payload = {
      apples: 10,
    }

    const taskData = {
      user: userMap[PERMISSION_USER.superuser].id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
      restartable: true,
      action: TASK_ACTION['cluster.create'],
      payload,
    }

    let sawTaskHandler = false

    const handlers = {
      [TASK_ACTION['cluster.create']]: ({
        store,
        task,
        checkCancelStatus
      }, done) => {

        const compareTask = {
          user: task.user,
          resource_type: task.resource_type,
          resource_id: task.resource_id,
          restartable: task.restartable,
          action: task.action,
          payload: task.payload,
        }

        t.ok(store, `the store was passed to the task handler`)
        t.deepEqual(compareTask, taskData, `the task data is correct`)
        t.equal(typeof(checkCancelStatus), 'function', `the checkCancelStatus function was passed to the handler`)

        sawTaskHandler = true

        done()
        
      }
    }

    const taskProcessor = TaskProcessor({
      store,
      handlers,
    })

    async.series([

      next => {
        store.task.create({
          data: taskData
        }, next)
      },

      next => {
        taskProcessor.start(next)
      },

      next => {
        // wait for the task to have got picked up
        setTimeout(next, 5000)
      },

      next => {
        taskProcessor.stop(next)
      },

      next => {
        t.ok(sawTaskHandler, `the task handler was run`)
        next()
      }

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    

    
  })


})