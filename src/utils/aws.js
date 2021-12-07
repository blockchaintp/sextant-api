const axios = require('axios');

const logger = require('../logging').getLogger({
  name: 'utils/aws',
})

const INSTANCE_METADATA_BASE_URL = 'http://169.254.169.254/latest/dynamic'

class AWS {
  static async getRegion() {
    try {
      const instanceId = {
        baseUrl: INSTANCE_METADATA_BASE_URL,
        url: '/instance-identity/document',
        timeout: 1000,
      }
      logger.info('Getting AWS region');
      const response = await axios.get(instanceId)
      logger.trace({ response, fn: 'getRegion' }, 'getRegion')
      return response.data.region
    } catch (error) {
      logger.warn({ error }, 'Failed to get region from instance metadata defaulting to us-east-1')
      return 'us-east-1'
    }
  }
}

module.exports = AWS
