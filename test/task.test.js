'use strict'

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
