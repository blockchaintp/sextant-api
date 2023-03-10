import * as axios from 'axios'
import { getLogger } from '../logging'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: __filename,
})

const INSTANCE_METADATA_BASE_URL = 'http://169.254.169.254/latest/dynamic'

export class AWS {
  static async getRegion() {
    try {
      const client = axios.default.create({
        baseURL: INSTANCE_METADATA_BASE_URL,
        timeout: 1000,
      })
      const url = '/instance-identity/document'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.info('Getting AWS region')
      const response = await client.get(url)
      const data = response.data as { region: string }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      logger.info({ region: data.region, fn: 'getRegion' }, 'getRegion')
      return data.region
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.warn({ error }, 'Failed to get region from instance metadata defaulting to us-east-1')
      return 'us-east-1'
    }
  }
}
