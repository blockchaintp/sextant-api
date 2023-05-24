/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/*

  looks after looping over each step in a generator function
  checking to see if the task has been cancelled before calling
  the next step

  generator is the task itself which must be a generator function
  params will be passed into the generator function
  onStep is called *before* each step is run - it can be used
  to cancel a task before the next step is invoked
*/

const Task = ({ generator, params = {}, onStep }) => {
  // pass an isCancelled into the generator function
  // so if it needs to run a long running promise
  // it can check for task cancellation and trigger a cancel itself
  const useParams = Object.assign({}, params, {
    cancel: () => (task.cancelled = true),
    isCancelled: () => task.cancelled,
  })

  // build a stack of generators so we can call inner generators from
  // the task and the stack will unwind
  const iterators = [generator(useParams)]

  // keep track of the lastValue - this is returned to each yield step
  let lastValue = null

  // the loop function over an iterator
  // it is always called on the last generator in the stack which
  // is removed once it has complete
  const next = async () => {
    // the callback before we run a step
    if (onStep) await onStep(task)

    // if we are cancelled do nothing
    if (task.cancelled) {
      return
    }

    // the stack is unwound and we are finished
    if (iterators.length <= 0) {
      return
    }

    // the current generator we are running
    const iterator = iterators[iterators.length - 1]

    // get the next yielded value from the generator
    let yielded = iterator.next(lastValue)
    let value = yielded.value

    // if the generator has finished - remove the last function from the stack
    // if we have none left we are finished
    if (yielded.done) {
      iterators.pop()
      if (iterators.length > 0) {
        await next()
      } else {
        return
      }
    }
    // the yielded value is a promise
    else if (value && typeof value.then == 'function') {
      value = await value
    }
    // the yielded value is a generator
    else if (value && typeof value[Symbol.iterator] === 'function' && typeof value.next === 'function') {
      iterators.push(value)
    }
    lastValue = value
    await next()
  }

  const run = async () => {
    await next()
    return task.cancelled ? null : lastValue
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
