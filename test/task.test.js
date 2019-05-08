'use strict'

const Promise = require('bluebird')
const tape = require('tape')

const Task = require('../src/task')

tape('task -> simple', async (t) => {

  const MESSAGE = 'hello'

  function* testTask(params) {
    yield `${params.message} 1`
    yield new Promise(resolve => {
      resolve(`${params.message} 2`)
    })
    yield new Promise(resolve => {
      setTimeout(() => resolve(`${params.message} 3`), 1000)
    })
  }

  const task = Task(testTask, {
    message: MESSAGE,
  })

  const finalValue = await task.run()

  t.equal(finalValue, `${MESSAGE} 3`)
  t.end()
})

tape('task -> with error thrown', async (t) => {

  const MESSAGE = 'hello'

  function* testTask(params) {
    yield `${params.message} 1`
    throw new Error('this is a test error')
  }

  const task = Task(testTask, {
    message: MESSAGE,
  })

  let error = null

  try {
    await task.run()
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
  t.equal(error.toString(), `Error: this is a test error`)
  
  t.end()
})


tape('task -> we get values back from yielding', async (t) => {

  function* testTask() {
    const firstValue = yield new Promise(resolve => {
      resolve(1)
    })

    const secondValue = yield new Promise(resolve => {
      resolve(firstValue * 2)
    })

    return secondValue
  }

  const task = Task(testTask)
  const finalValue = await task.run()

  t.equal(finalValue, 2, `the final value is correct`)
  t.end()
})

tape('task -> we can cancel a task', async (t) => {

  let didSeeSecondStage = false

  function* testTask() {
    const firstValue = yield new Promise(resolve => {
      setTimeout(() => resolve(1), 1000)
    })

    const secondValue = yield new Promise(resolve => {
      didSeeSecondStage = true
      resolve(firstValue * 2)
    })

    return secondValue
  }

  const task = Task(testTask)

  await Promise.all([
    task.run(),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        task.cancel()
        resolve()
      }, 100)
    })
  ])

  t.equal(didSeeSecondStage, false, `we did not get to the second stage`)
  t.equal(task.cancelled, true, `the task was cancelled`)

  t.end()
})