const axios = require('axios');
const logger = require('../logging').getLogger({
  name: __filename,
})

const INSTANCE_METADATA_BASE_URL = 'http://169.254.169.254/latest/dynamic'

class AWS {
  static async getRegion() {
    try {
      const client = axios.create({
        baseURL: INSTANCE_METADATA_BASE_URL,
        timeout: 1000,
      })
      const url = '/instance-identity/document'
      logger.info('Getting AWS region');
      const response = await client.get(url)
      logger.info({ region: response.data.region, fn: 'getRegion' }, 'getRegion')
      return response.data.region
    } catch (error) {
      logger.warn({ error }, 'Failed to get region from instance metadata defaulting to us-east-1')
      return 'us-east-1'
    }
  }
}

module.exports = AWS
