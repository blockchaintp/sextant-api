/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Settings } = require('./src/settings-singleton')

const settings = Settings.getInstance()

module.exports = settings.postgres
