/*

  looks after looping over each step in a generator function
  checking to see if the task has been cancelled before calling
  the next step
*/

const Task = (generator, params = {}) => {
  
  const iterator = generator(params)

  let lastValue = null

  const next = async () => {
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