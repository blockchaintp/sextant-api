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
  }, done) => {

  }
*/

const pino = require('pino')({
  name: 'task',
})

const TaskProcessor = ({
  store,
  handlers,
}) => {
  if(!store) {
    throw new Error(`store required`)
  }

  if(!handlers) {
    throw new Error(`handlers required`)
  }

  // start the listener loop for new tasks
  const start = (done) => {
    done()
  }

  // stop the listener loop for new tasks
  const stop = (done) => {
    done()
  }

  return {
    start,
    stop,
  }
}

module.exports = TaskProcessor