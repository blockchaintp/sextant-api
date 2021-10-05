const session = require('express-session')
const pg = require('pg')
const Knex = require('knex')
const PgSession = require('connect-pg-simple')(session)
const schedule = require('node-schedule')

const logger = require('./logging').getLogger({
  name: 'index',
})

const settings = require('./settings')
const App = require('./app')
const Initialise = require('./initialise')
const TaskHandlers = require('./tasks')
const Store = require('./store')

const deploymentMeter = require('./metering/deploymentMeter')
const { Meter } = require('./metering')
const { edition } = require('./edition')
// Start metering
const meter = new Meter(edition.metering)
meter.start()

const pgPool = new pg.Pool(settings.postgres.connection)
const sessionStore = new PgSession({
  pool: pgPool,
})

const knex = Knex(settings.postgres)
const store = Store(knex)

deploymentMeter(store)

const deploymentMeterJob = schedule.scheduleJob('*/5 * * * *', () => { deploymentMeter(store) })

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
    if (settings.logging) {
      logger.info({
        action: 'webserver.start',
        message: `webserver started on port ${settings.port}`,
      })
    }
  })

  app.taskProcessor.start(() => {
    logger.info({
      action: 'taskProcessor.start',
      message: 'taskProcessor started',
    })
  })
}

boot()

module.exports = deploymentMeterJob
