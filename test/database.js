'use strict'

const tape = require('tape')
const path = require('path')
const Knex = require('knex')
const randomstring = require('randomstring')

const getConnectionSettings = (databaseName) => {
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
  
  const masterKnex = Knex(getConnectionSettings())

  masterKnex
    .raw(`create database ${databaseName}`)
    .then(() => {
      const testKnex = Knex(getConnectionSettings(databaseName))
      testKnex.migrate.latest({
        directory: path.join(__dirname, '..', 'migrations')
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
  const masterKnex = Knex(getConnectionSettings())

  masterKnex
    .raw(`drop database ${databaseName}`)
    .then(() => {
      masterKnex.destroy()
      done()
    })
    .catch(done)
}

// wrap a handler function with a test before that creates a database connection
// pass the connection into the handler so it's tests can use it
// destroy the database as the last test
const testSuiteWithDatabase = (handler) => {
  let databaseConnection = null
  const getDatabaseConnection = () => databaseConnection

  const randomDatabaseName = randomstring.generate({
    length: 16,
    charset: 'alphabetic',
    capitalization: 'lowercase',
  })

  const databaseName = `testdb${randomDatabaseName}`
  tape('setup database', (t) => {
    createTestKnex(databaseName, (err, knex) => {
      t.notok(err, `there was no error`)
      databaseConnection = knex
      t.end()
    })
  })

  handler(getDatabaseConnection, getConnectionSettings(databaseName))

  tape('teardown database', (t) => {
    databaseConnection
      .destroy()
      .then(() => {
        destroyTestKnex(databaseName, (err, knex) => {
          t.notok(err, `there was no error`)
          t.end()
        })
      })
      .catch(err => {
        t.error(err)
        t.end()
      })
  })
}

module.exports = {
  getConnectionSettings,
  createTestKnex,
  destroyTestKnex,
  testSuiteWithDatabase,
}