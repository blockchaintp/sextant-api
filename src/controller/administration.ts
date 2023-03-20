import { getLogger } from '../logging'
import { Settings } from '../settings-singleton'

const settings = Settings.getInstance()
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
  }

  public startTime() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return settings.startTime
  }
}
