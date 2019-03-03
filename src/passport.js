'use strict'

const cookieParser = require('cookie-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const passport = require('passport')

const pino = require('pino')({
  name: 'passport',
})

const settings = require('./settings')

const Passport = (app, store) => {

  app.use(cookieParser())
  app.use(session({ 
    secret: settings.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new FileStore({
      path: store.SESSION_STORE_FOLDER,
    }),
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  // passport user serializer/deserializer
  passport.serializeUser((user, done) => {
    done(null, user.username)
  })
  passport.deserializeUser((username, done) => {
    store.user.get({
      username
    }, (err, user) => {
      if(err) {
        const errorInfo = {
          type: 'deserializeUser',
          error: err
        }
        pino.error(errorInfo)
        return done(errorInfo)
      }
      else if(!user) {
        const errorInfo = {
          type: 'deserializeUser',
          error: `no user found`
        }
        pino.error(errorInfo)
        return done(errorInfo)
      }
      else {
        return done(null, user)
      }
    })
  })
}

module.exports = Passport