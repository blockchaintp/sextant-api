import { Settings } from '../src/settings-singleton'
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { Store } from '../src/store'
import { setupPostgresContainers, tearDownPostgresContainers } from './common'
import randomstring from 'randomstring'
import { Initialise } from '../src/initialise'

describe('InitialUser', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let store: Store

  beforeAll(async () => {
    testDb = await setupPostgresContainers()
    store = new Store(testDb.db)
  }, 1200000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  }, 1200000)

  it('should create an initial user', async () => {
    const settings: Settings = {
      baseUrl: 'http://localhost:3000',
      initialPassword: randomstring.generate(32),
      initialUser: 'testuser',
      port: 3000,
      sessionSecret: randomstring.generate(24),
      tokenSecret: randomstring.generate(24),
      postgres: {
        client: 'pg',
        connection: {
          host: testDb.pgContainer.getHost(),
          port: 5434,
          password: 'postgres',
          user: 'postgres',
          database: 'postgres',
          ssl: false,
        },
        pool: {
          max: 10,
          min: 2,
        },
      },
      logging: 'debug',
      startTime: Date.now(),
    }

    const initialized = await Initialise({ store, useSettings: settings })
    expect(initialized).toBeTruthy()
    expect(initialized).toBe(true)
    const user = await store.user.get({ username: 'testuser' })
    expect(user).toBeDefined()
    expect(user?.username).toBe('testuser')
  }, 1200000)
})
