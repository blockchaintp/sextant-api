/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
const knex = require('knex')
const path = require('path')

function acquireDatabase(postgresContainer, port = 5432) {
  const config = {
    client: 'pg',
    connection: {
      host: postgresContainer.getHost(),
      port,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.join(__dirname, '../migrations'),
    },
  }

  return knex(config)
}

module.exports = {
  acquireDatabase,
}
