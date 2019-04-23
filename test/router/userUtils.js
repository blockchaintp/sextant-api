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
    password: 'pears',
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
  async.series([
    next => {
      registerUser({
        url,
        user: USERS.superuser,
        t,
      }, next)
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
      }, next)
    },

    next => {
      registerUser({
        url,
        user: USERS.user,
        t,
      }, next)
    },

    next => {
      logout({
        url,
        t,
      }, next)
    }

  ], done)
}

module.exports = {
  USERS,
  registerUser,
  login,
  logout,
  setupUsers,
}