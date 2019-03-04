const UserStore = require('./user')

const MockStore = (data) => {
  data = data || {}
  const user = UserStore(data.user)
  return {
    user,
  }
}

module.exports = MockStore