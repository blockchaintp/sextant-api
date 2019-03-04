'use strict'

const path = require('path')
const Knex = require('../../src/utils/knex')

const getDatabaseConnectionSettings = (databaseName) => {
  return {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_SERVICE_HOST || 'postgres',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: databaseName || 'postgres',
    },
    pool: {
      min: 2,
      max: 10
    }
  }
}

const getKnex = (databaseName) => Knex(getDatabaseConnectionSettings(databaseName))

// get a fresh knex connection that is pointing to a new database
// that has it's schema initialised
const getTestKnex = (databaseName, done) => {
  const masterKnex = getKnex()

  databaseName = databaseName || `testdb-${new Date().getTime()}`

  masterKnex
    .raw(`create database ${databaseName}`)
    .then(() => {
      const testKnex = getKnex(databaseName)
      testKnex.migrate.latest({
        directory: path.join(__dirname, '..', '..', 'migrations')
      })
      .then(() => {
        done(null, testKnex)
      })
      .catch(done)
    })
    .catch(done)
}

module.exports = {
  getDatabaseConnectionSettings,
  getKnex,
  getTestKnex,
}