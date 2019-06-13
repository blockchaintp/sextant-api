const settings = require('./settings')
const userUtils = require('./utils/user')
const config = require('./config')

const pino = require('pino')({
  name: 'initialise',
})

const createInitialUser = async ({
  store,
}) => {
  // check to see if we have been given an initial user and password
  // to create
  if(settings.initialUser && settings.initialPassword) {
    const users = await store.user.list({})
    if(users.length <= 0) {
      const hashed_password = await userUtils.getPasswordHash(settings.initialPassword)
      await store.user.create({
        data: {
          username: settings.initialUser,
          permission: config.PERMISSION_USER.superuser,
          hashed_password,
          server_side_key: userUtils.getTokenServerSideKey(),
        }
      })
      pino.info({
        action: 'createInitialUser',
        username: settings.initialUser,
      })
    }
  }
}

// code we run before the app is booted and starts serving
const Initialise = async ({
  store,
}) => {

  try {
    await createInitialUser({
      store,
    })
  } catch(error) {
    pino.error({
      error: error.toString(),
      stack: error.stack,
    })
    process.exit(1)
  }

  

  return true
}

module.exports = Initialise