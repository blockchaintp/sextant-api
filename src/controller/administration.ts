import { getLogger } from '../logging'
import { SettingsSingleton } from '../settings-singleton'

const settings = SettingsSingleton.getInstance()
const logger = getLogger({
  name: 'controller/administration',
})

export class AdministrationController {
  public restart() {
    logger.info({
      action: 'exiting the process',
      message: `This is pid ${process.pid}`,
    })
    setTimeout(() => {
      process.exit()
    }, 5000)
    return true
  }

  public startTime() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return settings.startTime
  }
}
