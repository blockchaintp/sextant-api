const logger = require('../logging').getLogger({
  name: 'controller/administration',
})

const settings = require('../settings')

const AdministrationController = () => {
  const restart = async () => {
    logger.info({
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
