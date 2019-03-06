'use strict'

const tape = require('tape')
const pg = require('pg')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const database = require('./database')
const config = require('../src/config')
const App = require('../src/app')

const TEST_PORT = 8888

const testSuiteWithApp = (handler) => {

  let app = null
  let server = null
  let pgPool = null

  database.testSuiteWithDatabase((getConnection, connectionSettings) => {
    tape('setup app', (t) => {

      const knex = getConnection()

      const settings = Object.assign({}, config)
      settings.postgres = connectionSettings

      pgPool = new pg.Pool(settings.postgres.connection)
      const sessionStore = new pgSession({
        pool: pgPool,
      })

      app = App({
        knex,
        settings,
        sessionStore,
      })

      server = app.listen(TEST_PORT, () => {
        t.end()
      })
    })

    handler({
      getConnection,
      url: `http://127.0.0.1:${TEST_PORT}${config.baseUrl}`,
    })

    tape('stop app', (t) => {
      server.close(() => {
        pgPool.end()
        t.end()
      })
    })
  })
}

module.exports = {
  testSuiteWithApp,
}