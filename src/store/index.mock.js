const UserStore = require('./user.mock')

const MockStore = (data) => {
  data = data || {}
  const user = UserStore(data.user)
  return {
    user,
  }
}

module.exports = MockStore