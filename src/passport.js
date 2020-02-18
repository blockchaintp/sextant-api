/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

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
    rolling: false,

    // in production this will be the postgres session store
    // otherwise default in the in-memory store for testing
    store: sessionStore,
    // 1 hour
    cookie: { maxAge: 1 * 60 * 60 * 1000 },
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  // JWT token based access
  app.use(async (req, res, next) => {

    try {

      if(req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ')

        if(parts.length != 2) {
          res._code = 400
          throw new Error(`bad authorization header format`)
        }

        const [ scheme, token ] = parts

        if (/^Bearer$/i.test(scheme)) {

          const decoded = await userUtils.decodeToken(token, settings.tokenSecret)

          // no user if we have no decoded token
          if(!decoded) return next()

          // no user if we don't have an id in the token
          if(!decoded.id) return next()

          // no user if we don't have a server_side_key in the token
          if(!decoded.server_side_key) return next()

          const user = await controllers.user.get({
            id: decoded.id,
          })

          if(!user || user.server_side_key != decoded.server_side_key) {
            res._code = 403
            throw new Error(`access denied`)
          }

          req.user = userUtils.safe(user)

          return next()
        } else {
          res._code = 400
          throw new Error(`bad authorization header format`)
        }
      }
      else {
        return next()
      }
    }
    catch(err) {
      return next(err)
    }
  })

  // passport user serializer/deserializer
  passport.serializeUser((user, done) => {
    done(null, user.username)
  })
  passport.deserializeUser(async (username, done) => {
    try {
      const user = await controllers.user.get({
        username
      })

      if(!user) {
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
    } catch(err) {
      const errorInfo = {
        type: 'deserializeUser',
        error: err.toString()
      }
      pino.error(errorInfo)
      return done(errorInfo)
    }
  })
}

module.exports = PassportHandlers
