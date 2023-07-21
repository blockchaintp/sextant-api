import { Knex } from 'knex'
import { Store } from '../../src/store'
import * as model from '../../src/store/model/model-types'
import Task from '../../src/tasks/task'

export function* testGenerator(params: { store: Store; task: model.Task; trx: Knex.Transaction }): Generator<any> {
  console.log('testGenerator', true)
  yield true
  console.log('testGenerator', false)
  yield false
  console.log('testGenerator', 'good')
  yield 'good'
  console.log('testGenerator', 'void')
  yield
  console.log('testGenerator', 1)
  yield 1
  console.log('testGenerator', undefined)
  yield undefined
  console.log('testGenerator', null)
  yield null
}

let stepCount = 0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testOnStep(task: model.Task) {
  stepCount++
}

describe('Task', () => {
  it('Task', async () => {
    const task = Task({
      generator: testGenerator,
      onStep: testOnStep,
    })
    await task.run()
    // since the onStep is at the beginning of next() we expect it to be called 8 times not 7
    expect(stepCount).toBe(8)
    expect(task.cancelled).toBe(false)
    task.cancel()
    expect(task.cancelled).toBe(true)
  }, 1200000)
})
