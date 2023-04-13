import dotenv from 'dotenv'
import { HelmTool } from './helmTool'
import { edition } from './edition'
import { getLogger } from './logging'

dotenv.config()

const logger = getLogger({
  name: './download-helm-charts',
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

void runHelmToolStart()
