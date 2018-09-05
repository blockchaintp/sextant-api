'use strict'

const EventEmitter = require('events')
const express = require('express')
const bodyParser = require('body-parser')
const pinoExpress = require('express-pino-logger')()

const pino = require('pino')({
  name: 'app',
})


// NOTE - to switch the storage implmentation, import a different module here
const Store = require('./store/file')
const Backends = require('./backends')
const Routes = require('./routes')
const JobDispatcher = require('./jobqueue/simple-dispatcher')
const JobHandler = require('./jobqueue/simple-handler')

const App = () => {

  // the data store
  const store = Store()

  // generic event emitter to communicate jobs between the dispatcher and handler
  const jobEventEmitter = new EventEmitter()

  // the job dispatcher and handlers
  const jobDispatcher = JobDispatcher(jobEventEmitter)
  const jobHandler = JobHandler(store, jobDispatcher)

  // wire up the job dispatcher and handler using the event emitter
  jobEventEmitter.on('job', jobHandler)

  // the backend logic handlers invoked by the HTTP routes
  const backends = Backends({
    store,
    jobDispatcher,
  })

  // the HTTP server
  const app = express()

  app.use(pinoExpress)
  app.use(bodyParser.json())

  // bind routes to the HTTP server
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