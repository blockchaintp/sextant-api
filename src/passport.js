'use strict'

const session = require('express-session')
const cookieParser = require('cookie-parser')
const Passport = require('passport').Passport
const userUtils = require('./utils/user')

const pino = require('pino')({
  name: 'passport',
})

const PassportHandlers = ({
  app,
  settings,
  sessionStore,
  controllers,
}) => {
  if(!app) {
    throw new Error(`app required`)
  }

  if(!settings) {
    throw new Error(`settings required`)
  }

  if(!controllers) {
    throw new Error(`store required`)
  }

  const passport = new Passport()

  app.use(cookieParser())
  app.use(session({ 
    secret: settings.sessionSecret,
    resave: false,
    saveUninitialized: true,

    // in production this will be the postgres session store
    // otherwise default in the in-memory store for testing
    store: sessionStore,
    // 30 days
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  // JWT token based access
  app.use((req, res, next) => {
    if(req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ')

      if(parts.length != 2) {
        res._code = 400
        return next(`bad authorization header format`)
      }

      const [ scheme, token ] = parts

      if (/^Bearer$/i.test(scheme)) {
        userUtils.decodeToken(token, settings.tokenSecret, (err, decoded) => {
          // no user if we have an error or no decoded token
          if(err || !decoded) return next()

          controllers.user.get({
            username: decoded.username,
          }, (err, user) => {
            if(err || !user || user.token_salt != decoded.salt) {
              res._code = 403
              return next(`access denied`)
            }

            req.user = userUtils.safe(user)
            return next()
          })
        })
      } else {
        res._code = 400
        return next(`bad authorization header format`)
      }
    }
    else {
      return next()
    }
  })

  // passport user serializer/deserializer
  passport.serializeUser((user, done) => {
    done(null, user.username)
  })
  passport.deserializeUser((username, done) => {
    controllers.user.get({
      username
    }, (err, user) => {
      if(err) {
        const errorInfo = {
          type: 'deserializeUser',
          error: err.toString()
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
        return done(null, userUtils.safe(user))
      }
    })
  })
}

module.exports = PassportHandlers