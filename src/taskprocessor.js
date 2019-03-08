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
  a task handler must be capable of cancelling itself but shoudn't have to worry about
  knowing if the cancel action has been triggered

  so - a task handler is invoked as follows:

  const handler = allTasks[task.payload.action]
  if(!handler) mark the task as error (no handler found)

  const cancelTask = handler(task, store, (err) => {
    if(err) mark the task as error
    else mark the task as finished
  })

  the 'cancelTask' is a function returned by the handler

  we run this function if we notice the task is switched to cancel whilst it's running

  control loop
  ------------

  loops doing the following actions:

   * check for tasks with 'created' status
   * for any created tasks found
      * switch them to 'running'
      * invoke the task handler
      * store the running task with it's cancel handler in memory
      * if callback is error - switch task to 'error'
      * if callback has result - switch task to 'finished'
  
   * check for tasks with 'cancelling' status
      * if the task is in the 'currentlyRunning' memory store
      * if yes - then invoke the cancelTask handler
      
   * check for each currently running task if it's been cancelled
   * for each cancelled tasks that was running:
      * switch it to 'cancelling'
      * invoke the cancelTask handler


*/

const pino = require('pino')({
  name: 'task',
})

const TaskProcessor = ({
  store,
  settings,
  handlers,
}) => {
  if(!store) {
    throw new Error(`store required`)
  }

  if(!settings) {
    throw new Error(`settings required`)
  }

  if(!handlers) {
    throw new Error(`handlers required`)
  }

  return {
    // start the listener loop for new tasks
    start: (done) => done(),

    // stop the listener loop for new tasks
    stop: (done) => done(),
  }
}

module.exports = TaskProcessor