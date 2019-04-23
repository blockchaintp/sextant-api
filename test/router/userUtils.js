'use strict'

const tools = require('../tools')
const config = require('../../src/config')

const {
  PERMISSION_USER,
} = config

const USERS = {
  super: {
    username: 'admin',
    password: 'apples',
    permission: PERMISSION_USER.superuser,
  },
  normal: {
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

module.exports = {
  USERS,
  registerUser,
  login,
  logout,
}