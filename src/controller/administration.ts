import { getLogger } from '../logging'
import settings from '../settings'

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
    return settings.startTime
  }
}
