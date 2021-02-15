const dotenv = require('dotenv');
const { HelmTool } = require('../src/helmTool')
const { edition } = require('../src/edition.js')

dotenv.config();

// eslint-disable-next-line import/order
const pino = require('pino')({
  name: 'download helm charts',
})

// helm add and helm pull(untar sextant)
const runHelmToolStart = async () => {
  if (edition && edition.helmRepos) {
    pino.info({
      action: 'downloading helm charts',
    })
    const helmTool = new HelmTool(edition)
    await helmTool.start()
  }
}

runHelmToolStart()
