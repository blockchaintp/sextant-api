const axios = require('axios');

const AWS = require('aws-sdk');
const logger = require('../logging').getLogger({
  name: 'metering/aws',
})

const start = (meteringDetails) => {
  const PRODUCT_CODE = meteringDetails.productCode
  const PUBLIC_KEY_VERSION = meteringDetails.publicKeyVersion
  const LOOP_DELAY = 1000 * 60 * 10
  let marketplaceMetering

  axios.get('http://169.254.169.254/latest/dynamic/instance-identity/document')
    .then((response) => {
      marketplaceMetering = new AWS.MarketplaceMetering({
        region: response.data.region,
      })
    })
    .catch((error) => {
      logger.error({
        type: 'registerUsage',
        error,
      })
      marketplaceMetering = new AWS.MarketplaceMetering({
        region: 'us-east-1',
      })
    }).then((response) => {
      const registerUsage = () => {
        marketplaceMetering.registerUsage({
          ProductCode: PRODUCT_CODE,
          PublicKeyVersion: PUBLIC_KEY_VERSION,
        }, (err, result) => {
          if (err) {
            logger.error({
              type: 'registerUsage',
              error: err,
            })
            if (err.code === 'PlatformNotSupportedException'
              || err.code === 'CustomerNotSubscribedException'
              || err === 'CredentialsError') {
              logger.error({
                type: 'registerUsage',
                activity: 'Shutting down because user is not subscribed.',
              })
              process.exit(1)
            }
          } else {
            logger.info({
              type: 'registerUsage',
              result,
              response,
            })
          }
        })
      }

      registerUsage()
      setInterval(registerUsage, LOOP_DELAY)
    })
}

// We never want to stop AWS meter, so return null
const stop = () => null

// eslint-disable-next-line no-unused-vars
const isAllowed = (entitlement) => true

// eslint-disable-next-line no-unused-vars
const record = (dimension, value) => null

module.exports = {
  start,
  stop,
  isAllowed,
  record,
}
