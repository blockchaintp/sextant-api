'use strict'

var pino = require('pino')({
  name: 'app',
})

const settings = require('./settings')
const App = require('./app')

const app = App()

app.listen(settings.port, () => {
  pino.info({
    action: 'webserver.start',
    message: `webserver started on port ${settings.port}`,
  })
})
