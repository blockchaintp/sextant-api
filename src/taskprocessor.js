/*

  keeps looping waiting for tasks to be in 'created' state

  once it finds a created task - look at the payload.action
  to see if we have a handler for that task - if not immeditely mark the task as 'error'

  if we do have a handler for that action - mark the task as 'running' and invoke the handler

  if the handler errors - mark the task as 'error'
  if the handler completes - mark the task as 'finished'

  cancelling
  ----------

  a task can be marked as 'cancelling' whilst it's running

  a task handler should be checking the status of the task at each step
  to see if it has been cancelled

  when invoking a task, we provide it with a function to run to check if
  the task has been switched to a 'cancelling' state

  the 'checkCancelStatus(callback)' function is called at each step of the handler

  if it returns true - the handler should just stop in it's track and do nothing

  checkCancelStatus will update the task status to cancelled if called and the task
  was in the 'cancelling' status

  it is assumed that whilst the checkCancelStatus is running, the task handler is not
  progressing (as it's waiting for confirmation that the task has not been cancelled)

  control loop
  ------------

  loops doing the following actions:

   * check for tasks with 'created' status
   * for any created tasks found
      * switch them to 'running'
      * invoke the task handler
      * if callback is error - switch task to 'error'
      * if callback has result - switch task to 'finished'
  
  
  task handlers
  -------------

  the 'task.action' property controls what handler is run when
  the task is created

  the handler for this task has the following signature:

  const taskHandler = ({
    store,                  // the store
    task,                   // the task database record
    checkCancelStatus,      // a function to check if the task has been cancelled
    logging,                // if the task handler should log
  }, done) => {

  }
*/

const async = require('async')
const pino = require('pino')({
  name: 'task',
})

const config = require('./config')

const {
  TASK_STATUS,
  TASK_CONTROLLER_LOOP_DELAY,
} = config

const TaskProcessor = ({
  store,
  handlers,
  logging,
}) => {
  if(!store) {
    throw new Error(`store required`)
  }

  if(!handlers) {
    throw new Error(`handlers required`)
  }

  let controlLoopRunning = false

  const loadTaskStatus = (id, done) => {
    store.task.get({
      id,
    }, (err, task) => {
      if(err) return done(err)
      done(null, task.status)
    })
  }

  const updateTaskStatus = (task, status, timestamps, done) => {

    if(logging) {
      pino.error({
        action: 'updatestatus',
        task: task,
        status,
      })
    }

    const updateData = {
      status,
    }

    if(timestamps.started) {
      updateData.started_at = store.knex.fn.now()
    }

    if(timestamps.ended) {
      updateData.ended_at = store.knex.fn.now()
    }

    store.task.update({
      id: task.id,
      data: updateData,
    }, done)
  }

  const errorTask = (task, error, done) => {

    if(logging) {
      pino.error({
        action: 'error',
        error: err.toString(),
        task: task,
      })
    }

    store.task.update({
      id: task.id,
      data: {
        status: TASK_STATUS.error,
        ended_at: store.knex.fn.now(),
        error,
      }
    }, done)
  }


  const loadTasksWithStatus = (status, done) => {
    store.task.list({
      status,
    }, done)
  }

  const loadRunningTasks = (done) => loadTasksWithStatus(TASK_STATUS.running, done)
  const loadCreatedTasks = (done) => loadTasksWithStatus(TASK_STATUS.created, done)

  // return a function that will check a running task cancel status
  const getCancelTaskHandler = (task) => (done) => {
    loadTaskStatus(task.id, (err, status) => {

      // if there was an error loading the task status
      // error the task and return true to the handler so it stops immediately
      if(err) {
        errorTask(task, `there was an error loading the task status for task ${task.id}: ${err.toString()}`, () => {
          // this cancels the task
          return done(null, true)
        })
      }
      else {
        // check to see if the task status is cancelling
        if(status == TASK_STATUS.cancelling) {
          // flag the task as cancelled
          updateTaskStatus(task, TASK_STATUS.cancelled, {ended: true}, (err) => {
            // if there was an error updating the task status to cancelled
            // error the task and return true to the handler so it stops immediately
            if(err) {
              errorTask(task, `there was an error updating the task status for task ${task.id}: ${err.toString()}`, () => {
                // this cancels the task
                return done(null, true)
              })
            }
            else {
              // this cancels the task
              return done(null, true)
            }
          })
        }
        // the task is ok - carry on
        else {
          done(null, false)
        }
      }
    })
  }

  const runTask = (task, done) => {
    const handler = handlers[task.action]

    if(!handler) {
      return errorTask(task, `no handler was found for task: ${task.action}`, done)
    }

    async.series([

      // mark the task as running
      next => updateTaskStatus(task, TASK_STATUS.running, {started: true}, next),

      // invoke the task handler
      next => {
        handler({
          store,
          task,
          checkCancelStatus: getCancelTaskHandler(task),
          logging,
        }, (err) => {
    
          // the task has errored - mark it
          if(err) {
            errorTask(task, err.toString(), () => {})
          }
          // the task has finished - mark it
          else {
            updateTaskStatus(task, TASK_STATUS.finished, {ended: true}, () => {
              if(logging) {
                pino.info({
                  action: 'finished',
                  task: task,
                })
              }
            })
          }
        })

        next()
      }

    ], done)

  }

  // this is called on initial startup
  // load all tasks that are in a running state
  // for those that are restartable - restart them
  // for that are not restartable - error them
  const restartTasks = (done) => {
    loadRunningTasks((err, tasks) => {
      if(err) return done(err)

      const runTasks = tasks.filter(task => task.restartable)
      const errorTasks = tasks.filter(task => !task.restartable)

      async.parallel({
        runTasks: next => {
          async.each(runTasks, (task, nextTask) => {
            runTask(task, nextTask)
          }, next)
        },

        errorTasks: next => {
          async.each(errorTasks, (task, nextTask) => {
            errorTask(task, `the server restarted whilst this task was running and the task is not restartable`, nextTask)
          }, next)
        },
      }, done)
    })
  }

  // called on each loop
  const controlLoop = (done) => {
    loadCreatedTasks((err, runTasks) => {
      if(err) return done(err)
      async.each(runTasks, (task, nextTask) => {
        runTask(task, nextTask)
      }, done)
    })
  }

  // start the control loop waiting for tasks in 'created' state
  const startControlLoop = (started) => {
    controlLoopRunning = true
    async.whilst(
      () => controlLoopRunning,
      (next) => controlLoop(err => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY)),
      // if we get an error from the control loop something has gone horribly wrong
      // if a task handler errors - it should update the task record with the error
      (err) => {
        if(err && logging) {
          pino.error({
            type: 'controlloop',
            error: err.toString(),
          })
        }
      },
    )
    // we return immediately because the control loop has started
    started()
  }

  const start = (done) => {
    async.series([
      next => restartTasks(next),
      next => startControlLoop(next),
    ], done)
  }

  const stop = (done) => {
    controlLoopRunning = false
    done()
  }

  return {
    start,
    stop,
  }
}

module.exports = TaskProcessor