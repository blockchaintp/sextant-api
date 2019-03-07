const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const randomstring = require('randomstring')
const SALT_ROUNDS = 10

const safe = (user) => {
  return {
    id: user.id,
    created_at: user.created_at,
    username: user.username,
    role: user.role,
    meta: user.meta,
  }
}

const getPasswordHash = (plainTextPassword, done) => bcrypt.hash(plainTextPassword, SALT_ROUNDS, done)
const compareHashedPasswords = (plainTextPassword, hash, done) => bcrypt.compare(plainTextPassword, hash, done)

const getTokenSalt = () => randomstring.generate(16)

const generateToken = (username, secret, done) => {
  const salt = getTokenSalt()
  jwt.sign({
    username,
    salt,
  }, secret, (err, token) => {
    if(err) return done(err)
    done(null, {
      token,
      salt,
    })
  })
}

const decodeToken = (token, secret, done) => {
  jwt.verify(token, secret, done)
}

module.exports = {
  safe,
  getPasswordHash,
  compareHashedPasswords,
  generateToken,
  decodeToken,
}