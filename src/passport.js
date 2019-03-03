'use strict'

const cookieParser = require('cookie-parser')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const passport = require('passport')

const pino = require('pino')({
  name: 'passport',
})

const PGPool = require('./utils/pgpool')
const settings = require('./settings')

const Passport = (app, store) => {

  const pgPool = PGPool()
  app.use(cookieParser())
  app.use(session({ 
    secret: settings.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new pgSession({
      pool: pgPool,
    }),
    // 30 days
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
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