/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const tape = require('tape')
const database = require('./database')
const config = require('../src/config')
const App = require('../src/app')

const TEST_PORT = 8888

const testSuiteWithAppTaskHandlers = (taskHandlers, handler) => {
  return testSuiteWithApp(handler, {
    taskHandlers,
  })
}

const testSuiteWithApp = (handler, opts) => {

  opts = opts || {}

  const {
    taskHandlers,
  } = opts

  let app = null
  let server = null

  database.testSuiteWithDatabase((getConnection, connectionSettings) => {
    tape('setup app', async (t) => {

      const knex = getConnection()

      const settings = Object.assign({}, config)
      settings.postgres = connectionSettings

      app = App({
        knex,
        settings,
        taskHandlers,
      })

      await app.taskProcessor.start()

      server = app.listen(TEST_PORT, (err) => {
        t.notok(err, `there was no error`)
        t.end()
      })


    })

    handler({
      getConnection,
      url: `http://127.0.0.1:${TEST_PORT}${config.baseUrl}`,
    })

    tape('stop app', async (t) => {

      await app.taskProcessor.stop()

      server.close((err) => {
        t.notok(err, `there was no error`)
        t.end()
      })
    })
  })
}

module.exports = {
  testSuiteWithAppTaskHandlers,
  testSuiteWithApp,
}
