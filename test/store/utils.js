'use strict'

const path = require('path')
const Knex = require('knex')

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

// get a fresh knex connection that is pointing to a new database
// that has it's schema initialised
const createTestKnex = (databaseName, done) => {
  
  const masterKnex = Knex(getDatabaseConnectionSettings())

  masterKnex
    .raw(`create database ${databaseName}`)
    .then(() => {
      const testKnex = Knex(getDatabaseConnectionSettings(databaseName))
      testKnex.migrate.latest({
        directory: path.join(__dirname, '..', '..', 'migrations')
      })
      .then(() => {
        masterKnex.destroy()
        done(null, testKnex)
      })
      .catch(done)
    })
    .catch(done)
}

const destroyTestKnex = (databaseName, done) => {
  const masterKnex = Knex(getDatabaseConnectionSettings())

  masterKnex
    .raw(`drop database ${databaseName}`)
    .then(() => {
      masterKnex.destroy()
      done()
    })
    .catch(done)
}

module.exports = {
  getDatabaseConnectionSettings,
  createTestKnex,
  destroyTestKnex,
}