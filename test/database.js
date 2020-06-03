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
      min: 0,
      max: 10,
    }
  }
}

// get a fresh knex connection that is pointing to a new database
// that has it's schema initialised
const createTestKnex = async (databaseName) => {
  const masterKnex = Knex(getConnectionSettings())
  await masterKnex.raw(`create database ${databaseName}`)
  const testKnex = Knex(getConnectionSettings(databaseName))
  try {
    await testKnex.migrate.latest({
      directory: path.join(__dirname, '..', 'migrations')
    })
  } catch(e) {
    await testKnex.destroy()
    await masterKnex.destroy()
    throw e
  }
  await masterKnex.destroy()
  return testKnex
}

const destroyTestKnex = async (databaseName) => {
  const masterKnex = Knex(getConnectionSettings())
  await masterKnex.raw(`drop database ${databaseName}`)
  await masterKnex.destroy()
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
  let databaseSetupStatus = false

  tape('setup database', async (t) => {

    try {
      databaseConnection = await createTestKnex(databaseName)
      databaseSetupStatus = true
    } catch(err) {
      t.fail(`database setup error: ${err.toString()}`)
    }

    t.end()
  })

  // only attempt the actual test if the database was setup
  if(databaseSetupStatus) {
    handler(getDatabaseConnection, getConnectionSettings(databaseName))

    tape('teardown database', async (t) => {

      try {
        await databaseConnection.destroy()
        if(!process.env.KEEP_DATABASE) {
          await destroyTestKnex(databaseName)
        }
        
      } catch(err) {
        t.fail(`database teardown error: ${err.toString()}`)
      }
  
      t.end()
  
    })
  } 
}

module.exports = {
  getConnectionSettings,
  createTestKnex,
  destroyTestKnex,
  testSuiteWithDatabase,
}