const pino = require('pino')({
  name: 'initialise',
})

const randomstring = require('randomstring')
const settings = require('./settings')
const userUtils = require('./utils/user')
const config = require('./config')

const createInitialUser = async ({
  store,
}) => {
  // check to see if we have been given an initial user and password
  // to create
  if (settings.initialUser && settings.initialPassword) {
    const users = await store.user.list()
    if (users.length <= 0) {
      const hashed_password = await userUtils.getPasswordHash(settings.initialPassword)
      await store.user.create({
        data: {
          username: settings.initialUser,
          permission: config.USER_TYPES.superuser,
          hashed_password,
          server_side_key: userUtils.getTokenServerSideKey(),
        },
      })
      pino.info({
        action: 'createInitialUser',
        username: settings.initialUser,
      })
    }
  }
}

const handleSessionSecret = async ({ store }) => {
  // Is there a session.secret in the database?
  const data = await store.settings.get({ key: 'session.secret' })
  if (data) {
    settings.sessionSecret = data.value
  } else {
    // If not, create one
    const response = await store.settings.create({
      data: {
        key: 'session.secret',
        value: randomstring.generate(24),
      },
    })
    settings.sessionSecret = response.value
  }
}

const handleTokenSecret = async ({ store }) => {
  // Is there a token.secret in the database?
  const data = await store.settings.get({ key: 'token.secret' })
  if (data) {
    settings.tokenSecret = data.value
  } else {
    // If not, create one
    const response = await store.settings.create({
      data: {
        key: 'token.secret',
        value: randomstring.generate(24),
      },
    })
    settings.tokenSecret = response.value
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
    await handleSessionSecret({ store })
    await handleTokenSecret({ store })
  } catch (error) {
    pino.error({
      error: error.toString(),
      stack: error.stack,
    })
    process.exit(1)
  }

  return true
}

module.exports = Initialise
