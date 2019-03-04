const UserStore = require('./user')

const Store = (knex) => {
  const user = UserStore(knex)

  return {
    user,
  }
}

module.exports = Store