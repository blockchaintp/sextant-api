const bcrypt = require('bcrypt')
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

module.exports = {
  safe,
  getPasswordHash,
  compareHashedPasswords,
}