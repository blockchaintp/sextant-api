'use strict'

const tape = require('tape')
const database = require('./database')
const config = require('../src/config')
const App = require('../src/app')

const TEST_PORT = 8888

const testSuiteWithApp = (handler) => {

  let server = null

  database.testSuiteWithDatabase((getConnection, connectionSettings) => {
    tape('setup app', (t) => {

      const knex = getConnection()

      const settings = Object.assign({}, config)
      settings.postgres = connectionSettings

      const app = App({
        knex,
        settings,
      })

      server = app.listen(TEST_PORT, (err) => {
        t.notok(err, `there was no error`)
        t.end()        
      })
    })

    handler({
      getConnection,
      url: `http://127.0.0.1:${TEST_PORT}${config.baseUrl}`,
    })

    tape('stop app', (t) => {
      server.close((err) => {
        t.notok(err, `there was no error`)
        t.end()
      })
    })
  })
}

module.exports = {
  testSuiteWithApp,
}