const Promise = require('bluebird')
const tape = require('tape')

const Task = require('../src/task')

tape('task -> simple', async (t) => {
  const MESSAGE = 'hello'

  function* testTask(params) {
    yield `${params.message} 1`
    yield new Promise((resolve) => {
      resolve(`${params.message} 2`)
    })
    yield new Promise((resolve) => {
      setTimeout(() => resolve(`${params.message} 3`), 100)
    })
  }

  const task = Task({
    generator: testTask,
    params: {
      message: MESSAGE,
    },
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

  const task = Task({
    generator: testTask,
    params: {
      message: MESSAGE,
    },
  })

  let error = null

  try {
    await task.run()
  } catch (err) {
    error = err
  }

  t.ok(error, 'there was an error')
  t.equal(error.toString(), 'Error: this is a test error')

  t.end()
})

tape('task -> we get values back from yielding', async (t) => {
  function* testTask() {
    const firstValue = yield new Promise((resolve) => {
      resolve(1)
    })

    const secondValue = yield new Promise((resolve) => {
      resolve(firstValue * 2)
    })

    return secondValue
  }

  const task = Task({
    generator: testTask,
  })
  const finalValue = await task.run()

  t.equal(finalValue, 2, 'the final value is correct')
  t.end()
})

tape('task -> we can cancel a task', async (t) => {
  let didSeeSecondStage = false

  function* testTask() {
    const firstValue = yield new Promise((resolve) => {
      setTimeout(() => resolve(1), 100)
    })

    const secondValue = yield new Promise((resolve) => {
      didSeeSecondStage = true
      resolve(firstValue * 2)
    })

    return secondValue
  }

  const task = Task({
    generator: testTask,
  })

  await Promise.all([
    task.run(),
    new Promise((resolve) => {
      setTimeout(() => {
        task.cancel()
        resolve()
      }, 10)
    }),
  ])

  t.equal(didSeeSecondStage, false, 'we did not get to the second stage')
  t.equal(task.cancelled, true, 'the task was cancelled')

  t.end()
})

tape('task -> we can cancel a task via an on step complete handler', async (t) => {
  let didSeeFirstStage = false
  let didSeeSecondStage = false

  function* testTask() {
    const firstValue = yield new Promise((resolve) => {
      didSeeFirstStage = true
      setTimeout(() => resolve(1), 100)
    })

    const secondValue = yield new Promise((resolve) => {
      didSeeSecondStage = true
      resolve(firstValue * 2)
    })

    return secondValue
  }

  const task = Task({
    generator: testTask,

    onStep: (innerTask) => innerTask.cancel(),
  })

  await Promise.all([
    task.run(),
    new Promise((resolve) => {
      setTimeout(() => {
        task.cancel()
        resolve()
      }, 10)
    }),
  ])

  t.equal(didSeeFirstStage, false, 'we did not get to the first stage')
  t.equal(didSeeSecondStage, false, 'we did not get to the second stage')
  t.equal(task.cancelled, true, 'the task was cancelled')

  t.end()
})

tape('task -> inner generators', async (t) => {
  const MESSAGE = 'hello'
  const steps = []

  function* innerTask() {
    steps.push(yield Promise.resolve(2))
    steps.push(yield Promise.resolve(3))
  }

  function* testTask() {
    steps.push(yield 1)
    yield innerTask()
    steps.push(yield Promise.resolve(4))
  }

  const task = Task({
    generator: testTask,
    params: {
      message: MESSAGE,
    },
  })

  await task.run()

  t.deepEqual(steps, [
    1,
    2,
    3,
    4,
  ], 'the steps were run in the correct order')

  t.end()
})

tape('task -> cancel from inside an inner generator', async (t) => {
  const steps = []

  function* innerTask() {
    steps.push(yield 2)
    yield Promise.delay(100)
    steps.push(yield 3)
  }

  function* testTask() {
    steps.push(yield Promise.resolve(1))
    yield innerTask()
  }

  const task = Task({
    generator: testTask,
  })

  await Promise.all([
    task.run(),
    new Promise((resolve) => {
      setTimeout(() => {
        task.cancel()
        resolve()
      }, 10)
    }),
  ])

  t.deepEqual(steps, [
    1,
    2,
  ], 'the task was cancelled from inside an inner generator')

  t.end()
})

tape('task -> test for long running Promise cancellation', async (t) => {
  const steps = []

  function* testTask(params) {
    yield Promise.each([1, 2, 3, 4, 5], async (i) => {
      if (!params.isCancelled()) steps.push(i)
      await Promise.delay(100)
    })
  }

  const task = Task({
    generator: testTask,
  })

  await Promise.all([
    task.run(),
    new Promise((resolve) => {
      setTimeout(() => {
        task.cancel()
        resolve()
      }, 10)
    }),
  ])

  t.deepEqual(steps, [
    1,
  ], 'only one value was added because the task was cancelled')

  t.end()
})

tape('task -> self cancellation', async (t) => {
  const steps = []

  function* testTask(params) {
    yield Promise.each([1, 2, 3, 4, 5], async (i) => {
      if (!params.isCancelled()) steps.push(i)
      await Promise.delay(100)
      params.cancel()
    })
  }

  const task = Task({
    generator: testTask,
  })

  await task.run()

  t.deepEqual(steps, [
    1,
  ], 'only one value was added because the task was cancelled')

  t.end()
})
