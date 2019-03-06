'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const Knex = require('knex')

const Passport = require('./passport')

const pino = require('pino')({
  name: 'app',
})

const Store = require('./store')
const Controller = require('./controller')
const Router = require('./router')

const App = ({
  knex,
  store,
  controllers,
  settings,
  sessionStore,
}) => {

  knex = knex || Knex(settings.postgres)
  store = store || Store(knex)

  controllers = controllers || Controller({
    store,
  })

  // the HTTP server
  const app = express()

  app.use(bodyParser.json())

  // hook up the session store
  Passport({
    app,
    store,
    settings,
    sessionStore,
  })

  // bind routes to the HTTP server
  Router({
    app,
    store,
    controllers,
    settings,
  })

  /*
  
    404 handler - any route that didn't match in routes/index.js
    will hit this handler - always prefer a JSON response
    
  */
  app.use((req, res, next) => {
    const error = `url ${req.url} not found`
    pino.error({
      action: 'error',
      error,
      code: 404,
    })
    res.status(res._code || 404)
    res.json({ error })
  })

  /*
  
    error handler - any route that calls the err handler will end up here
    always prefer a JSON response
    
  */
  app.use((err, req, res, next) => {
    pino.error({
      action: 'error',
      error: err.toString(),
      code: res._code || 500
    })
    // if the error was with the deserializer then logout to clear the cookie
    if(err.type == 'deserializeUser') {
      req.logout()
    }
    res.status(res._code || 500)
    res.json({ error: err.toString() })
  })

  return app
}

module.exports = App