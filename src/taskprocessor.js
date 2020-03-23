/*

  keeps looping waiting for tasks to be in 'created' state

  once it finds a created task - look at the payload.action
  to see if we have a handler for that task - if not immeditely mark the task as 'error'

  if we do have a handler for that action - mark the task as 'running' and invoke the handler

  if the handler errors - mark the task as 'error'
  if the handler completes - mark the task as 'finished'
  if the task was cancelled - mark the task as 'cancelled'

  cancelling
  ----------

  a task can be marked as 'cancelling' whilst it's running

  the task handlers are generator functions

  each time `yield` is called - we check for the cancelled status of the task
  and do not continue if it's been cancelled

  YOU MUST CALL `yield` in a task handler for any async functions
  the yield call should give a promise

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

  the task handler must be a generator function and yield any promises
  so the task can be cancelled if needed

  the handler for this task has the following signature:

  function* taskHandler({
    store,                  // the store
    task,                   // the task database record
    logging,                // if the task handler should log
  }) {
    
    const data = yield store.thing.list()

    // this step will never happen if the task was cancelled in the meantime
    yield store.thing.update({
      ...
    })
  }
  
*/

const EventEmitter = require('events')
const Promise = require('bluebird')
const async = require('async')
const pino = require('pino')({
  name: 'task',
})

const config = require('./config')
const Task = require('./task')
const resourceUpdater = require('./controller/error_handling/index')

const {
  TASK_STATUS,
  RESOURCE_TYPES,
  TASK_RESOURCE_COMPLETE_STATUS,
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

  const taskProcessor = new EventEmitter()
  let controlLoopRunning = false
  let stopped = false

  // the store handlers for the resources we can start tasks for
  const resourceTypeStores = {
    [RESOURCE_TYPES.cluster]: store.cluster,
    [RESOURCE_TYPES.deployment]: store.deployment,
  }

  // get the current status of a task
  const loadTaskStatus = (id) => 
    store.task.get({
      id,
    })
      .then(task => task.status)

  // get a list of tasks with the given status
  const loadTasksWithStatus = (status) => store.task.list({
    status,
  })
    
  const loadRunningTasks = () => loadTasksWithStatus(TASK_STATUS.running)
  const loadCreatedTasks = () => loadTasksWithStatus(TASK_STATUS.created)

  // return a function that will check a running task cancel status
  const isTaskCancelled = async (task) => {
    const status = await loadTaskStatus(task.id)
    return status == TASK_STATUS.cancelling
  }

  // update the status of a task
  // timestamps indicates what fields we should stamp as now
  const updateTaskStatus = (task, status, timestamps) => {

    const updateData = {
      status,
    }

    if(timestamps.started) {
      updateData.started_at = store.knex.fn.now()
    }

    if(timestamps.ended) {
      updateData.ended_at = store.knex.fn.now()
    }

    return store.task.update({
      id: task.id,
      data: updateData,
    })
  }

  // mark the task as failed and update the corresponding resource with
  // the error status
  const errorTask = async (task, error) => {

    if(logging) {
      pino.error({
        action: 'error',
        error: error.toString(),
        stack: error.stack,
        task: task,
      })
    }

    // update the task store to indicate the task failed
    await store.task.update({
      id: task.id,
      data: {
        status: TASK_STATUS.error,
        ended_at: store.knex.fn.now(),
        error: error.toString().substring(0, 250),
      }
    })

    // update the corresponding resource to indicate the task failed
    // the resource updater function from controller/error_handling determines how to update the resource
    const resourceTypeStore = resourceTypeStores[task.resource_type]

    await resourceUpdater(task, task.action, error, resourceTypeStore)

  }

  // mark the task as complete and update the corresponding resource with
  // the correct status - if the task was cancelled - we don't update
  // the resource status
  const completeTask = async (task, trx, cancelled) => {
    // what status are we setting the task to
    const finalTaskStatus = cancelled ?
        TASK_STATUS.cancelled :
        TASK_STATUS.finished

    await updateTaskStatus(task, finalTaskStatus, {ended: true})

    // if the task completed - we update the resource to the correct status
    if(!cancelled) {
      // get a reference to the store handler for the task resource
      const resourceTypeStore = resourceTypeStores[task.resource_type]
      const finalResourceStatus = TASK_RESOURCE_COMPLETE_STATUS[task.action]

      await resourceTypeStore.update({
        id: task.resource_id,
        data: {
          status: task.resource_status.completed,
        },
      }, trx)
    }
  }

  // run a task
  // we create a transaction and pass it as part of the params into the task
  // this means the task's database updates will get unwound on an error
  const runTask = async (task) => {
    await store.transaction(async trx => {
      
      // check that we have a handler for the task
      const handler = handlers[task.action]

      if(!handler) {
        throw new Error(`no handler was found for task: ${task.action}`)
      }

      // update the task be to in running state
      const runningTask = await updateTaskStatus(task, TASK_STATUS.running, {started: true})

      // create the task runner
      const runner = Task({
        generator: handler,
        params: {
          store,
          trx,
          task: runningTask,
          logging,
        },
        // before each yielded step of the task - check if the database has a cancel
        // status and cancel the task if yes
        onStep: async (task) => {
          const isCancelled = await isTaskCancelled(runningTask)
          if(isCancelled) runner.cancel()
        },
      })

      taskProcessor.emit('task.start', task)

      await runner.run()
      
      await completeTask(task, trx, runner.cancelled)
      
      taskProcessor.emit('task.complete', task)
    })
      .catch(async err => {
        await errorTask(task, err)
        taskProcessor.emit('task.error', task, err)
      })
    
    taskProcessor.emit('task.processed', task)
  }

  // this is called on initial startup
  // load all tasks that are in a running state
  // for those that are restartable - restart them
  // for that are not restartable - error them
  const restartTasks = async () => {
    const tasks = await loadRunningTasks()

    const runTasks = tasks.filter(task => task.restartable)
    const errorTasks = tasks.filter(task => !task.restartable)

    await Promise.all([
      Promise.each(runTasks, runTask),
      Promise.each(errorTasks, task => errorTask(task, `the server restarted whilst this task was running and the task is not restartable`)),
    ])
  }

  // called on each loop
  const controlLoop = async () => {
    if(!controlLoopRunning) return
    try {
      const runTasks = await loadCreatedTasks()
      await Promise.each(runTasks, runTask)
      await Promise.delay(TASK_CONTROLLER_LOOP_DELAY)
      controlLoop()
    } catch(err) {
      if(logging) {
        pino.error({
          type: 'controlloop',
          error: err.toString(),
        })
      }
      throw err
    }
  }

  // start the control loop waiting for tasks in 'created' state
  const startControlLoop = () => {
    if(stopped) throw new Error(`the task processor was stopped`)
    controlLoopRunning = true
    controlLoop()
  }

  const start = async () => {
    if(stopped) throw new Error(`the task processor was stopped`)
    try {
      await restartTasks()
      startControlLoop()
    } catch(err) {
      if(logging) {
        pino.error({
          type: 'start',
          error: err.toString(),
        })
      }
      throw err
    }
  }

  const stop = () => {
    controlLoopRunning = false
    stopped = true
    return Promise.delay(TASK_CONTROLLER_LOOP_DELAY)
  }

  taskProcessor.start = start
  taskProcessor.stop = stop

  return taskProcessor
}

module.exports = TaskProcessor