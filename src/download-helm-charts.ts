import dotenv from 'dotenv'
import { HelmTool } from './helmTool'
import { edition } from './edition'
import { getLogger } from './logging'

dotenv.config()

const logger = getLogger({
  name: './download-helm-charts',
})

const helmTool = new HelmTool(edition)
helmTool.start().catch((reason: unknown) => {
  logger.error(
    {
      reason,
    },
    'Error running helmTool.start()'
  )
  process.exit(1)
})
