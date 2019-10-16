'use strict'

const session = require('express-session')
const pg = require('pg')
const Knex = require('knex')
const pgSession = require('connect-pg-simple')(session)
const settings = require('./settings')
const Metering = require('./metering')
const App = require('./app')
const Initialise = require('./initialise')
const TaskHandlers = require('./tasks')
const Store = require('./store')

const pino = require('pino')({
  name: 'app',
})

const { Meter }= require('./metering')
const { edition } = require('./edition')
// Start metering
const meter = new Meter(edition.metering)
meter.start()

const pgPool = new pg.Pool(settings.postgres.connection)
const sessionStore = new pgSession({
  pool: pgPool,
})

const knex = Knex(settings.postgres)
const store = Store(knex)

const app = App({
  knex,
  store,
  settings,
  sessionStore,
  taskHandlers: TaskHandlers({}),
})

const boot = async () => {

  // wait the the initialisation to complete
  // before we start listing on the port and
  // start the task processor
  await Initialise({
    store,
  })

  app.listen(settings.port, () => {
    if(settings.logging) {
      pino.info({
        action: 'webserver.start',
        message: `webserver started on port ${settings.port}`,
      })
    }
  })

  app.taskProcessor.start(() => {
    pino.info({
      action: 'taskProcessor.start',
      message: `taskProcessor started`,
    })
  })
}

boot()
