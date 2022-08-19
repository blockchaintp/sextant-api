import { get } from 'config'
import PgConnect from 'connect-pg-simple'
import session from 'express-session'
import Knex from 'knex'
import { scheduleJob } from 'node-schedule'
import { Pool } from 'pg'
import App from './app'
import Controllers from './controller'
import Initialise from './initialise'
import deploymentStatusPoll from './jobs/deploymentStatusPoll'
import Meter from './jobs/meter/Meter'
import Logging from './logging'
import settings from './settings'
import Store from './store'
import TaskHandlers from './tasks'

const logger = Logging.getLogger({
  name: 'index',
})

const PgSession = PgConnect(session)

const pgPool = new Pool(settings.postgres.connection)
const sessionStore = new PgSession({
  pool: pgPool,
})

const knex = Knex(settings.postgres)
const store = Store(knex)

const meter = new Meter('main-meter', store, get('meter'))
meter.start()

const controllers = Controllers({ store, settings })

deploymentStatusPoll(store)
const deploymentStatusPollJob = scheduleJob('*/5 * * * *', () => {
  deploymentStatusPoll(store)
})

const app = App({
  knex,
  store,
  controllers,
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

  app.app.listen(settings.port, () => {
    if (settings.logging) {
      logger.info({
        action: 'webserver.start',
        message: `webserver started on port ${settings.port}`,
      })
    }
  })

  app.taskProcessor.start()
}

boot()

export default { deploymentStatusPollJob }
