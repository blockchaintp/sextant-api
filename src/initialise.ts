/* eslint-disable camelcase */
import * as randomstring from 'randomstring'
import * as config from './config'
import { getLogger } from './logging'
import { SettingsSingleton, Settings } from './settings-singleton'
import { Store } from './store'
import * as userUtils from './utils/user'

const logger = getLogger({
  name: 'initialise',
})

const createInitialUser = async ({ store, settings }: { store: Store; settings: Settings }) => {
  // check to see if we have been given an initial user and password
  // to create
  if (
    settings.initialUser &&
    settings.initialPassword &&
    settings.initialUser !== '' &&
    settings.initialPassword !== ''
  ) {
    const users = await store.user.list()
    if (users.length <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const hashed_password = await userUtils.getPasswordHash(settings.initialPassword)
      await store.user.create({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          username: settings.initialUser,
          permission: config.USER_TYPES.superuser,
          hashed_password,
          server_side_key: userUtils.getTokenServerSideKey(),
        },
      })
      logger.info({
        action: 'createInitialUser',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        username: settings.initialUser,
      })
    }
  }
}

const handleSessionSecret = async ({ store, settings }: { store: Store; settings: Settings }) => {
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

const handleTokenSecret = async ({ store, settings }: { store: Store; settings: Settings }) => {
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
export const Initialise = async ({ store, useSettings }: { store: Store; useSettings?: Settings }) => {
  const settings = useSettings || SettingsSingleton.getInstance()

  try {
    await createInitialUser({
      store,
      settings,
    })
    await handleSessionSecret({ store, settings })
    await handleTokenSecret({ store, settings })
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        error: error.toString(),
        stack: error.stack,
      })
    } else {
      logger.error({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error,
      })
    }
    process.exit(1)
  }

  return true
}
