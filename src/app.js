/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-underscore-dangle */
const express = require('express')
const Knex = require('knex')

const logger = require('./logging').getLogger({
  name: 'app',
})
const Passport = require('./passport')

const { Store } = require('./store')
const { Controller } = require('./controller')
const Router = require('./router')
const TaskProcessor = require('./taskprocessor')

const App = ({ knex, store, controllers, settings, sessionStore, taskHandlers }) => {
  // eslint-disable-next-line no-param-reassign
  knex = knex || Knex(settings.postgres)
  // eslint-disable-next-line no-param-reassign
  store = store || new Store(knex)

  // eslint-disable-next-line no-param-reassign
  controllers =
    controllers ||
    new Controller({
      store,
      settings,
    })

  // the HTTP server
  const app = express()

  app.disable('etag')

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache')
    next()
  })

  // hook up the session store
  Passport({
    app,
    settings,
    controllers,
    sessionStore,
  })

  // bind routes to the HTTP server
  Router({
    app,
    store,
    controllers,
    settings,
  })

  const taskProcessor = TaskProcessor({
    store,
    handlers: taskHandlers || {},
    logging: true,
  })

  /*

    404 handler - any route that didn't match in routes/index.js
    will hit this handler - always prefer a JSON response

  */
  // The `next` here is required for some reason
  // eslint-disable-next-line no-unused-vars
  app.use((req, res, next) => {
    const error = `url ${req.url} not found`
    if (settings.logging) {
      logger.error({
        action: 'error',
        error,
        code: 404,
      })
    }
    res.status(res._code || 404)
    res.json({ error })
  })

  /*

    error handler - any route that calls the err handler will end up here
    always prefer a JSON response

  */
  // The `next` here is required for some reason
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (settings.logging) {
      logger.error({
        action: 'error',
        error: err.error ? err.error.toString() : err.toString(),
        stack: err.stack,
        code: err._code || res._code || 500,
      })
    }
    // if the error was with the deserializer then logout to clear the cookie
    if (err.type === 'deserializeUser') {
      req.logout((e) => {
        res.status(err._code || res._code || 500)
        res.json({ error: err, logoutError: e })
      })
    } else {
      res.status(err._code || res._code || 500)
      res.json({ error: err.toString() })
    }
  })

  app.taskProcessor = taskProcessor

  return app
}

module.exports = App
