'use strict'

const EventEmitter = require('events')
const express = require('express')
const async = require('async')
const url = require('url')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const httpProxy = require('http-proxy')
const passport = require('passport')
//const LocalStrategy = require('passport-local').Strategy
const pinoExpress = require('express-pino-logger')()

const pino = require('pino')({
  name: 'app',
})


// NOTE - to switch the storage implmentation, import a different module here
const Store = require('./store/file')
const Backends = require('./backends')
const Routes = require('./routes')
const settings = require('./settings')
const JobDispatcher = require('./jobqueue/simple-dispatcher')
const JobHandler = require('./jobqueue/simple-handler')

const App = () => {

  const proxy = httpProxy.createProxyServer({
    // ssl: true,
    // secure: true
  })

  proxy.on('error', (err, req, res) => {
    console.log('Proxy server error: \n', err);
    res.status(500).json({ message: err.message });
  })

  // the data store
  const store = Store({

  })

  store.initialize()

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

  //app.use(pinoExpress)
  app.use(bodyParser.json())
  app.use(cookieParser())
  app.use(session({ 
    secret: settings.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new FileStore({
      path: store.SESSIONS_FOLDER,
    }),
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  // passport user serializer/deserializer
  passport.serializeUser((user, done) => {
    done(null, user.username)
  })
  passport.deserializeUser((username, done) => {
    store.getUser({
      username
    }, (err, user) => {
      // 
      if(err) {
        return done({
          type: 'deserializeUser',
          error: err
        })
      }
      else if(!user) {
        return done({
          type: 'deserializeUser',
          error: `no user found`
        })
      }
      else {
        return done(null, user)
      }
    })
  })
/*
  // passport local login handler
  passport.use(new LocalStrategy(
    (username, password, done) => {
      store.getUser(username, (err, user) => {
        if(err) return done(err)
        if(!user) return done(null, false, { message: 'Incorrect username.' })
        store.checkUserPassword({
          username,
          password,
        }, (err, ok) => {
          if(err) return done(err)
          if(!ok) return done(null, false, { message: 'Incorrect password.' })
          reutrn done(null, user)
        })
      })
    }
  ))
*/
  // bind routes to the HTTP server
  Routes(app, backends)

  const handleProxy = (req, res, next) => {

    const clustername = req.params.clustername
    const namespace = req.params.namespace
    const service = req.params.service
    const stub = req.params[0] || '/'
    const queryString = req._parsedUrl.search || ''

    async.waterfall([

      (next) => {

        // read the various auth details needed for this cluster proxy
        async.parallel({
          settings: nextp => store.getClusterSettings({clustername}, nextp),
          ca: nextp => nextp(null, store.getLocalClusterFilePath(clustername, 'ca.pem')),
          cert: nextp => nextp(null, store.getLocalClusterFilePath(clustername, 'admin.pem')),
          key: nextp => nextp(null, store.getLocalClusterFilePath(clustername, 'admin-key.pem')),
          username: nextp => store.readClusterFile({
            clustername,
            filename: 'username'
          }, nextp),
          password: nextp => store.readClusterFile({
            clustername,
            filename: 'password'
          }, nextp),

        }, next)
      },

      (cluster, next) => {
        const clusterSettings = cluster.settings
        const target = `https://api.${ clusterSettings.name }.${ clusterSettings.domain }/api/v1/namespaces/${ namespace }/services/https:${ service }:/proxy/${ stub }${ queryString }`
        next(null, {
          target,
          secure: false,
          ignorePath: true,
          auth: `${ cluster.username }:${ cluster.password }`,
          ssl: {
            key: cluster.key,
            cert: cluster.cert,
            ca: [cluster.ca],
          }
        })
      }
    ], (err, options) => {
      if(err) return next(err)
      proxy.web(req, res, options)
    })
  }

  app.all('/proxy/:clustername/:namespace/:service', handleProxy)
  app.all('/proxy/:clustername/:namespace/:service/*', handleProxy)

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