import dotenv from 'dotenv'
import { HelmTool } from './helmTool'
import { edition } from './edition'
import { getLogger } from './logging'
import { SettingsSingleton } from './settings-singleton'
import { Store } from './store'

dotenv.config()

const logger = getLogger({
  name: './download-helm-charts',
})
const settings = SettingsSingleton.getInstance()
const store = Store.create(settings)
const helmTool = new HelmTool(edition, store)
helmTool.start().catch((reason: unknown) => {
  logger.error(
    {
      reason,
    },
    'Error running helmTool.start()'
  )
  process.exit(1)
})
