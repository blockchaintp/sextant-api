'use strict'

const AWS = require('../aws-sdk');
const pino = require('pino')({
  name: 'metering.ecs',
})

const PRODUCT_CODE = '90e15i980lrlbxxnm0w7hsw15'
const PUBLIC_KEY_VERSION = 1

// 10 minutes
const LOOP_DELAY = 1000 * 60 * 10

const marketplacemetering = new AWS.MarketplaceMetering({

})

const registerUsage = () => {
  marketplacemetering.registerUsage({
    ProductCode: PRODUCT_CODE,
    PublicKeyVersion: PUBLIC_KEY_VERSION,
  }, (err, result) => {
    if(err) {
      pino.error({
        type: 'registerUsage',
        error: err,
      })
    }
    else {
      pino.info({
        type: 'registerUsage',
        result,
      })
    }
  })
}

registerUsage()
setInterval(registerUsage, LOOP_DELAY)
