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
  TASK_CONTROLLER_LOOP_DELAY,
  TASK_STATUS,
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

    let createdTask = null

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
        taskProcessor.start(next)
      },

      next => {
        store.task.create({
          data: taskData
        }, (err, task) => {
          if(err) return next(err)
          createdTask = task
          next()
        })
      },

      next => {
        // wait for the task to have got picked up
        setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2)
      },

      next => {
        taskProcessor.stop(next)
      },

      next => {
        store.task.get({
          id: createdTask.id,
        }, (err, task) => {
          if(err) return next(err)
          t.ok(sawTaskHandler, `the task handler was run`)
          t.equal(task.status, TASK_STATUS.finished, `the task has finished status`)
          t.ok(task.started_at, `there is a started at timestamp`)
          t.ok(task.ended_at, `there is a ended at timestamp`)
          next()
        })
        
      }

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    

    
  })


})