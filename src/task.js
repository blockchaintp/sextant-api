/*

  looks after looping over each step in a generator function
  checking to see if the task has been cancelled before calling
  the next step
*/

const Task = (generator, params) => {
  
  let cancelled = false
  const iterator = generator(params)

  let lastValue = null

  const next = async () => {
    const yielded = iterator.next()
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
    return lastValue
  }

  const cancel = () => {

  }

  return {
    run,
    cancel,
  }
}

module.exports = Task