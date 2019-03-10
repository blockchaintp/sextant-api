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
    jobWillNotFinish,
  }, done) => {

    let createdTask = null
    let taskStarted = false
    let taskFinished = false

    const handlers = {
      [TASK_ACTION['cluster.create']]: (params, done) => {

        const compareTask = getCompareTask(params.task)
          
        t.ok(params.store, `the store was passed to the task handler`)
        t.deepEqual(compareTask, taskData, `the task data is correct`)
        t.equal(typeof(params.checkCancelStatus), 'function', `the checkCancelStatus function was passed to the handler`)
        t.equal(typeof(params.cancelSeries), 'function', `the cancelSeries function was passed to the handler`)
        t.equal(typeof(params.cancelWaterfall), 'function', `the cancelWaterfall function was passed to the handler`)
        t.equal(params.task.status, TASK_STATUS.running, `the task is in running status`)

        taskStarted = true

        handler(params, (err) => {
          taskFinished = true
          done(err)
        })
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
      next => {
        async.whilst(
          () => taskStarted ? false : true,
          (nextw) => setTimeout(nextw, 100),
          next,
        )
      },
      
      // if we've been given a function to run once we know the task
      // has been picked up - run it, otherwise continue
      next => {
        if(whilstRunningHandler) whilstRunningHandler(createdTask, next)
        else next()
      },

      // wait for the task to have finished
      next => {

        if(jobWillNotFinish) return next()

        async.whilst(
          () => taskFinished ? false : true,
          (nextw) => setTimeout(nextw, 100),
          next,
        )
      },

      // pause so the processor has a chance to finish the task
      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY),

      // stop the task processor
      next => taskProcessor.stop(next),
        
      next => {
        store.task.get({
          id: createdTask.id,
        }, (err, task) => {
          if(err) return next(err)
          t.ok(taskStarted, `the task handler was run`)

          if(!jobWillNotFinish) {
            t.ok(taskFinished, `the task handler finished`)
          }
          
          t.ok(task.started_at, `there is a started at timestamp`)
          t.ok(task.ended_at, `there is a ended at timestamp`)
          checkFinalTask(task, next)
        })
        
      }

    ], done)
  }

  tape('task processor -> create cluster task', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()
      
      const handler = (params, done) => done()

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.finished, `the task has finished status`)
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

  tape('task processor -> error task handler', (t) => {

    const store = Store(getConnection())

    const ERROR_TEXT = `this is a test error`

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()
      
      const handler = (params, done) => done(ERROR_TEXT)

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.error, `the task has error status`)
        t.equal(task.error, ERROR_TEXT, `the error text of the task is correct`)
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

  tape('task processor -> cancel a task without checking the checkCancelStatus', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()
      
      const handler = (params, done) => {
        // wait for longer than the test will wait before calling
        // the whilstRunningHandler to make sure we cancel the task
        // before the task completes
        setTimeout(done, TASK_CONTROLLER_LOOP_DELAY)
      }

      const whilstRunningHandler = (task, done) => {
        store.task.update({
          id: task.id,
          data: {
            status: TASK_STATUS.cancelling,
          }
        }, done)
      }

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.cancelled, `the task has cancelled status`)
        done()
      }


      testTaskHandler(t, {
        store,
        taskData,
        handler,
        whilstRunningHandler,
        checkFinalTask,
      }, finished)
    })
    
  })

  tape('task processor -> cancel a task with checking the checkCancelStatus', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()

      const handler = (params, done) => {

        async.series([

          // wait a short while for the task to get cancelled from outside
          next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY),

          // call the check cancel handler - we should get true
          next => params.checkCancelStatus((err, cancelled) => {
            t.ok(cancelled, `the task should have been cancelled`)
            return
          })

        ], () => {})
      }

      const whilstRunningHandler = (task, done) => {
        store.task.update({
          id: task.id,
          data: {
            status: TASK_STATUS.cancelling,
          }
        }, done)
      }

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.cancelled, `the task has cancelled status`)
        done()
      }


      testTaskHandler(t, {
        store,
        taskData,
        handler,
        whilstRunningHandler,
        checkFinalTask,
        jobWillNotFinish: true,
      }, finished)
    })
    
  })

  // this checks what happens if we cancel a task but still finish the job
  tape('task processor -> cancel a task with checking the checkCancelStatus but still finish the task', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()

      const handler = (params, done) => {

        async.series([

          // wait a short while for the task to get cancelled from outside
          next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY),

          // call the check cancel handler - we should get true
          next => params.checkCancelStatus((err, cancelled) => {
            t.ok(cancelled, `the task should have been cancelled`)
            next()
          })

        ], done)
      }

      const whilstRunningHandler = (task, done) => {
        store.task.update({
          id: task.id,
          data: {
            status: TASK_STATUS.cancelling,
          }
        }, done)
      }

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.cancelled, `the task has cancelled status`)
        done()
      }


      testTaskHandler(t, {
        store,
        taskData,
        handler,
        whilstRunningHandler,
        checkFinalTask,
      }, finished)
    })
    
  })

  tape('task processor -> use the cancelSeries function without cancelling', (t) => {

    const store = Store(getConnection())

    cleanUpWrapper(t, store, (finished) => {

      const taskData = getTaskFixture()

      const stepsSeen = {
        step1: false,
        step2: false,
      }

      const handler = (params, done) => {

        params.cancelSeries([

          // wait a short while for the task to get cancelled from outside
          next => {
            stepsSeen.step1 = true
            next()
          },

          next => {
            stepsSeen.step2 = true
            next()
          },

        ], done)
      }

      const checkFinalTask = (task, done) => {
        t.equal(task.status, TASK_STATUS.finished, `the task has finished status`)
        t.ok(stepsSeen.step1, `step1 was seen`)
        t.ok(stepsSeen.step2, `step2 was seen`)
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