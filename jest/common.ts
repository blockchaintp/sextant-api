import { Knex } from 'knex'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
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
    .withExposedPorts({ container: 5432, host: 5432 })
    .start()
  const db = (await acquireDatabase(pgContainer)) as Knex
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
