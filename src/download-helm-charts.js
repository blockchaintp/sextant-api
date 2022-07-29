const dotenv = require('dotenv')
const { HelmTool } = require('./helmTool')
const { edition } = require('./edition/index')

dotenv.config()

// eslint-disable-next-line import/order
const logger = require('./logging').getLogger({
  name: 'src/download-helm-charts',
})

// helm add and helm pull(untar sextant)
const runHelmToolStart = async () => {
  if (edition && edition.helmRepos) {
    logger.info({
      action: 'downloading helm charts',
    })
    const helmTool = new HelmTool(edition)
    await helmTool.start()
  }
}

runHelmToolStart()
