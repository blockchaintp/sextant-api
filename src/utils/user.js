const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const randomstring = require('randomstring')
const config = require('../config')

const {
  PERMISSION_USER,
  PERMISSION_USER_ACCESS_LEVELS,
} = config

const SALT_ROUNDS = 10

const safe = (user) => {
  return {
    id: user.id,
    created_at: user.created_at,
    username: user.username,
    permission: user.permission,
    meta: user.meta,
  }
}

const getPasswordHash = (plainTextPassword, done) => bcrypt.hash(plainTextPassword, SALT_ROUNDS, done)
const compareHashedPasswords = (plainTextPassword, hash, done) => bcrypt.compare(plainTextPassword, hash, done)

const getTokenServerSideKey = () => randomstring.generate(16)

// create the token given the username and server_side_key
const getToken = (id, server_side_key, secret, done) => {
  if(!id) return done(`id required to get token`)
  if(!server_side_key) return done(`server_side_key required to get token`)
  if(!secret) return done(`secret required to get token`)
  jwt.sign({
    id,
    server_side_key,
  }, secret, done)
}

const decodeToken = (token, secret, done) => {
  jwt.verify(token, secret, done)
}

const hasPermission = (user, permission) => {
  const userAccessLevel = PERMISSION_USER_ACCESS_LEVELS[user.permission]
  const requiredAccessLevel = PERMISSION_USER_ACCESS_LEVELS[permission]
  return userAccessLevel >= requiredAccessLevel
}

const isSuperuser = (user) => hasPermission(user, PERMISSION_USER.superuser)
const isAdminuser = (user) => hasPermission(user, PERMISSION_USER.admin)

module.exports = {
  safe,
  getPasswordHash,
  compareHashedPasswords,
  getTokenServerSideKey,
  getToken,
  decodeToken,
  hasPermission,
  isSuperuser,
  isAdminuser,
}