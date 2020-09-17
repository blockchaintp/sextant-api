const pino = require('pino')({
  name: 'administration controller',
})

const settings = require('../settings')

const AdministrationController = () => {
  const restart = async () => {
    pino.info({
      action: 'exiting the process',
      message: `This is pid ${process.pid}`,
    })
    setTimeout(() => {
      process.exit();
    }, 5000);
  }

  const startTime = () => settings.startTime

  return {
    restart,
    startTime,
  }
}

module.exports = AdministrationController
