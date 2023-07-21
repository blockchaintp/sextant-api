import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { setupPostgresContainers, tearDownPostgresContainers } from '../common'
import { TaskProcessor } from '../../src/tasks/taskprocessor'
import { Store } from '../../src/store'
import Tasks from '../../src/tasks'
import { delay } from 'bluebird'

describe('TaskProcessor', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }

  beforeAll(async () => {
    testDb = await setupPostgresContainers()
  }, 1200000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  }, 1200000)

  it('constructor', async () => {
    const processor = TaskProcessor({
      store: new Store(testDb.db),
      logging: true,
      handlers: Tasks({
        testMode: true,
      }),
    })
    await processor.start()
    await delay(20000)
    await processor.stop()
  }, 60000)
})
