const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const randomstring = require('randomstring')
const config = require('../config')

const {
  USER_TYPES,
  USER_ACCESS_LEVELS,
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

const getPasswordHash = (plainTextPassword) => new Promise((resolve, reject) => {
  bcrypt.hash(plainTextPassword, SALT_ROUNDS, (err, result) => {
    if(err) return reject(err)
    resolve(result)
  })
})

const compareHashedPasswords = (plainTextPassword, hash) =>  new Promise((resolve, reject) => {
  bcrypt.compare(plainTextPassword, hash, (err, result) => {
    if(err) return reject(err)
    resolve(result)
  })
})

const getTokenServerSideKey = () => randomstring.generate(16)

// create the token given the username and server_side_key
const getToken = (id, server_side_key, secret) => {
  if(!id) throw new Error(`id required to get token`)
  if(!server_side_key) throw new Error(`server_side_key required to get token`)
  if(!secret) throw new Error(`secret required to get token`)
  return new Promise((resolve, reject) => {
    jwt.sign({
      id,
      server_side_key,
    }, secret, (err, result) => {
      if(err) return reject(err)
      resolve(result)
    })
  })
  
}

const decodeToken = (token, secret) => new Promise((resolve, reject) => {
  jwt.verify(token, secret, (err, result) => {
    if(err) return reject(err)
    resolve(result)
  })
})

const hasMinimumUserType = (user, permission) => {
  const userAccessLevel = USER_ACCESS_LEVELS[user.permission]
  const requiredAccessLevel = USER_ACCESS_LEVELS[permission]
  return userAccessLevel >= requiredAccessLevel
}

const isSuperuser = (user) => hasMinimumUserType(user, USER_TYPES.superuser)
const isAdminuser = (user) => hasMinimumUserType(user, USER_TYPES.admin)

module.exports = {
  safe,
  getPasswordHash,
  compareHashedPasswords,
  getTokenServerSideKey,
  getToken,
  decodeToken,
  hasMinimumUserType,
  isSuperuser,
  isAdminuser,
}