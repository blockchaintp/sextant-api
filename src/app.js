'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const pinoExpress = require('express-pino-logger')()

const pino = require('pino')({
  name: 'app',
})

const Backends = require('./backends')
const Routes = require('./routes')

const App = () => {

  const backends = Backends()
  const app = express()

  app.use(pinoExpress)
  app.use(bodyParser.json())

  Routes(app, backends)

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
      code: res._code
    })
    res.status(res._code || 500)
    res.json({ error: err.toString() })
  })

  return app
}

module.exports = App