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
  TABLES,
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

  const getTaskFixture = () => ({
    user: userMap[PERMISSION_USER.superuser].id,
    resource_type: RESOURCE_TYPES.cluster,
    resource_id: 10,
    restartable: true,
    action: TASK_ACTION['cluster.create'],
    payload: {
      apples: 10,
    },
  })

  const getCompareTask = (task) => ({
    user: task.user,
    resource_type: task.resource_type,
    resource_id: task.resource_id,
    restartable: task.restartable,
    action: task.action,
    payload: task.payload,
  })

  // clean up all tasks from the database after each test
  const cleanUpWrapper = (t, store, handler) => {
    handler((err) => {
      t.notok(err, `there was no error`)
      store.knex(TABLES.task)
        .del()
        .returning('*')
        .asCallback((err) => {
          t.notok(err, `there was no error`)
          t.end()
        })
    })
  }

  // wrap the creation of the task processor
  // initial task and loading of final task in a handler
  // to make it easier to test different outcomes for a task
  const testTaskHandler = (t, {
    taskData,
    handler,
    whilstRunningHandler,
    checkFinalTask,
    store,
  }, done) => {

    let createdTask = null
    let sawTaskHandler = false

    const handlers = {
      [TASK_ACTION['cluster.create']]: ({
        store,
        task,
        checkCancelStatus
      }, done) => {

        const compareTask = getCompareTask(task)
          
        t.ok(store, `the store was passed to the task handler`)
        t.deepEqual(compareTask, taskData, `the task data is correct`)
        t.equal(typeof(checkCancelStatus), 'function', `the checkCancelStatus function was passed to the handler`)
        t.equal(task.status, TASK_STATUS.running, `the task is in running status`)

        sawTaskHandler = true

        handler({
          store,
          task,
          checkCancelStatus
        }, done)
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

      // wait for the task to have got picked up
      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),
      
      // if we've been given a function to run once we know the task
      // has been picked up - run it, otherwise continue
      next => {
        if(whilstRunningHandler) whilstRunningHandler(next)
        else next()
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
          checkFinalTask(task, next)
        })
        
      }

    ], done)
  }

  tape('task processor -> test create cluster task', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()
      
      const handler = (params, done) => done()

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.finished, `the task has finished status`)
        t.ok(task.started_at, `there is a started at timestamp`)
        t.ok(task.ended_at, `there is a ended at timestamp`)
        done()
      }

      testTaskHandler(t, {
        store,
        taskData,
        handler,
        checkFinalTask,
      }, finished)
    })
    
  })

  tape('task processor -> test an error task handler', (t) => {

    const store = Store(getConnection())

    const ERROR_TEXT = `this is a test error`

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()
      
      const handler = (params, done) => done(ERROR_TEXT)

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.error, `the task has error status`)
        t.equal(task.error, ERROR_TEXT, `the error text of the task is correct`)
        t.ok(task.started_at, `there is a started at timestamp`)
        t.ok(task.ended_at, `there is a ended at timestamp`)
        done()
      }

      testTaskHandler(t, {
        store,
        taskData,
        handler,
        checkFinalTask,
      }, finished)
    })
    
  })


})