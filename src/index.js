'use strict'

const session = require('express-session')
const pg = require('pg')
const pgSession = require('connect-pg-simple')(session)
const settings = require('./settings')
const App = require('./app')
const pino = require('pino')({
  name: 'app',
})

const pgPool = new pg.Pool(settings.postgres.connection)
const sessionStore = new pgSession({
  pool: pgPool,
})

const app = App({
  settings,
  sessionStore,
})

app.listen(settings.port, () => {
  pino.info({
    action: 'webserver.start',
    message: `webserver started on port ${settings.port}`,
  })
})
