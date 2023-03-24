/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { SettingsSingleton } = require('./src/settings-singleton')

const settings = SettingsSingleton.getInstance()

module.exports = settings.postgres
