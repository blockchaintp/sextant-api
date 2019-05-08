/*

  looks after looping over each step in a generator function
  checking to see if the task has been cancelled before calling
  the next step

  generator is the task itself which must be a generator function
  params will be passed into the generator function
  onStep is called *before* each step is run - it can be used
  to cancel a task before the next step is invoked
*/

const Task = ({
  generator,
  params = {},
  onStep,
}) => {
  
  const iterator = generator(params)

  let lastValue = null

  const next = async () => {
    if(onStep) await onStep(task)
    if(task.cancelled) {
      return
    }
    const yielded = iterator.next(lastValue)
    if(yielded.done) {
      return
    }
    let value = yielded.value
    // the yielded value is a promise
    if(value && typeof(value.then) === 'function') {
      value = await value
    }
    lastValue = value
    await next()
  }

  const run = async () => {
    await next()
    return task.cancelled ?
      null :
      lastValue
  }

  const cancel = () => {
    task.cancelled = true
  }

  const task = {
    run,
    cancel,
    cancelled: false,
  }

  return task
}

module.exports = Task