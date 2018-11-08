'use strict'

const pino = require('pino')({
  name: 'app',
})

const settings = require('./settings')
const App = require('./app')
const Metering = require('./metering')

const app = App()

app.listen(settings.port, () => {
  pino.info({
    action: 'webserver.start',
    message: `webserver started on port ${settings.port}`,
  })
})
