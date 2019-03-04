const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10

const safe = (user) => {
  return {
    username: user.username,
    type: user.type,
  }
}

const requireUser = (type) => (req, res, next) => {
  if(!req.user) {
    res
      .status(403)
      .json({
        error: 'user account required'
      })
    return
  }
  if(type && req.user.type != type) {
    res
      .status(403)
      .json({
        error: `user account of type ${type} required`
      })
    return
  }
  next()
}

// if there are no users - then allow a non-logged in user
// to create a new user - otherwise they must be an admin
const addUserAuthHandler = (controller) => (req, res, next) => {
  const adminHandler = requireUser('admin')

  controller.count({}, (err, userCount) => {
    if(err) return next(err)
    if(userCount <= 0) return next()
    adminHandler(req, res, next)
  })
}

const getPasswordHash = (plainTextPassword, done) => bcrypt.hash(plainTextPassword, SALT_ROUNDS, done)
const compareHashedPasswords = (plainTextPassword, hash, done) => bcrypt.compare(plainTextPassword, hash, done)

module.exports = {
  safe,
  requireUser,
  addUserAuthHandler,
  getPasswordHash,
  compareHashedPasswords,
}