'use strict'

const pino = require('pino')({
  name: 'app',
})

const settings = require('./settings')
const App = require('./app')

const app = App({
  settings,
})

app.listen(settings.port, () => {
  pino.info({
    action: 'webserver.start',
    message: `webserver started on port ${settings.port}`,
  })
})
