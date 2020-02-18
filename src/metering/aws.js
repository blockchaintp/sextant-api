/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'
const axios = require('axios');

const AWS = require('aws-sdk');
const pino = require('pino')({
  name: 'metering.ecs',
})


const start = (meteringDetails) => {
  const PRODUCT_CODE = meteringDetails.productCode
  const PUBLIC_KEY_VERSION = meteringDetails.publicKeyVersion
  const LOOP_DELAY = 1000 * 60 * 10
  let marketplaceMetering

  axios.get('http://169.254.169.254/latest/dynamic/instance-identity/document')
    .then(response => {
      marketplaceMetering = new AWS.MarketplaceMetering({
        region: response.data.region
      })
    })
    .catch(error => {
      pino.error({
        type: 'registerUsage',
        error: error,
      })
      marketplaceMetering = new AWS.MarketplaceMetering({
        region: 'us-east-1'
      })
    }).then ( response => {
      const registerUsage = () => {
        marketplaceMetering.registerUsage({
          ProductCode: PRODUCT_CODE,
          PublicKeyVersion: PUBLIC_KEY_VERSION,
        }, (err, result) => {
          if(err) {
            pino.error({
              type: 'registerUsage',
              error: err,
            })
            if(err.code === "PlatformNotSupportedException" || err.code === "CustomerNotSubscribedException" || "CredentialsError") {
              pino.error({
                type: 'registerUsage',
                activity: 'Shutting down because user is not subscribed.'
              })
              process.exit(1)
            }
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
    }
  )
}

const stop = () => {
  // We never want to stop AWS meter, so return null
  return null
}

const isAllowed = (entitlement) => {
  return true
}

const record = (dimension, value) => {
  return null
}


module.exports = {
  start,
  stop,
  isAllowed,
  record
}
