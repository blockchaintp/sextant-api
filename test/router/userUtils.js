'use strict'

const async = require('async')
const tools = require('../tools')
const config = require('../../src/config')

const {
  PERMISSION_USER,
} = config

const USERS = {
  superuser: {
    username: 'superuser',
    password: 'apples',
    permission: PERMISSION_USER.superuser,
  },
  admin: {
    username: 'admin',
    password: 'peaches',
    permission: PERMISSION_USER.admin,
  },
  user: {
    username: 'user',
    password: 'oranges',
    permission: PERMISSION_USER.user,
  }
}

const registerUser = ({
  url,
  user,
  t,
}, done) => {
  tools.sessionRequest({
    t,
    method: 'post',
    url: `${url}/user`,
    json: true,
    body: user,
  }, (err, res, body) => {
    t.notok(err, `there is no error`)
    t.equal(res.statusCode, 201, `201 code`)
    t.equal(body.username, user.username, `the username is correct`)
    t.equal(body.permission, user.permission, 'the user was created with superuser permission')
    t.notok(body.hashed_password, 'the hashed_password is not in the result')
    t.notok(body.server_side_key, 'the server_side_key is not in the result')
    done(null, body)
  })
}

const login = ({
  url,
  user,
  t,
}, done) => {
  tools.sessionRequest({
    t,
    method: 'post',
    url: `${url}/user/login`,
    json: true,
    body: {
      username: user.username,
      password: user.password,
    },
  }, (err, res, body) => {
    t.notok(err, `there is no error`)
    t.equal(res.statusCode, 200, `200 code`)
    t.equal(body.ok, true, 'result was ok')
    done(null, body)
  })
}

const logout = ({
  url,
  t,
}, done) => {
  tools.sessionRequest({
    t,
    method: 'get',
    url: `${url}/user/logout`,
    json: true,
  }, (err, res, body) => {
    t.notok(err, `there is no error`)
    t.equal(res.statusCode, 200, `200 code`)
    t.equal(body.ok, true, `ok was true`)
    done()
  })
}

const setupUsers = ({
  url,
  t,
}, done) => {

  const users = {}
  async.series([
    next => {
      registerUser({
        url,
        user: USERS.superuser,
        t,
      }, (err, user) => {
        if(err) return next(err)
        users.superuser = user
        next()
      })
    },

    next => {
      login({
        url,
        user: USERS.superuser,
        t,
      }, next)
    },

    next => {
      registerUser({
        url,
        user: USERS.admin,
        t,
      }, (err, user) => {
        if(err) return next(err)
        users.admin = user
        next()
      })
    },

    next => {
      registerUser({
        url,
        user: USERS.user,
        t,
      }, (err, user) => {
        if(err) return next(err)
        users.user = user
        next()
      })
    },

    next => {
      logout({
        url,
        t,
      }, next)
    }

  ], (err) => {
    if(err) return done(err)
    done(null, users)
  })
}

const withUser = ({
  url,
  t,
  user,
}, testFunction, done) => {
  async.series([

    next => {
      login({
        url,
        user,
        t,
      }, next)
    },

    next => testFunction(next),

  ], (err) => {
    logout({
      url,
      t,
    }, (logouterr) => {
      done(err || logouterr)
    })
  })
}

module.exports = {
  USERS,
  registerUser,
  login,
  logout,
  setupUsers,
  withUser,
}