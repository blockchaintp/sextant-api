const dotenv = require('dotenv')
const { HelmTool } = require('../src/helmTool')
const { edition } = require('../src/edition')

dotenv.config()

// eslint-disable-next-line import/order
const logger = require('../src/logging').getLogger({
  name: 'scripts/download-helm-charts',
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
