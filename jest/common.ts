import knex, { Knex } from 'knex'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { USER_TYPES } from '../src/config'
import { Store } from '../src/store'
import { getPasswordHash } from '../src/utils/user'
import { acquireDatabase } from './db-config'

export async function setupPostgresContainers() {
  const c = new GenericContainer('postgres:11')
  const pgContainer = await c
    .withEnvironment({
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_PORT: '5432',
    })
    .withExposedPorts(5432)
    .start()
  const hostPort = pgContainer.getMappedPort(5432)
  const db = (await acquireDatabase(pgContainer, hostPort)) as Knex
  let dbNotReady = true
  while (dbNotReady) {
    try {
      await db.raw('select 1')
      dbNotReady = false
    } catch (e) {
      console.log('Waiting for postgres to start')
      dbNotReady = true
    }
  }
  await db.migrate.latest()
  return {
    db,
    pgContainer,
  }
}

export async function tearDownPostgresContainers({ db, pgContainer }: { db: Knex; pgContainer: StartedTestContainer }) {
  await db.destroy()
  await pgContainer.stop()
}

export async function makeAUser(store: Store, username: string, userType = USER_TYPES.user) {
  return store.user.create({
    data: {
      username,
      server_side_key: 'server_side_key',
      permission: userType,
      hashed_password: await getPasswordHash('apples'),
    },
  })
}
