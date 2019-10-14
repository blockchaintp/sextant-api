'use strict'
const axios = require('axios');

const AWS = require('aws-sdk');
const pino = require('pino')({
  name: 'metering.ecs',
})

//Sextant for Sawtooth
const PRODUCT_CODE = '965zq9jyoo7ry5e2cryolgi2l'
const PUBLIC_KEY_VERSION = 1

// 10 minutes
const LOOP_DELAY = 1000 * 60 * 10

let marketplacemetering
// get region of aws cluster
axios.get('http://169.254.169.254/latest/dynamic/instance-identity/document')
    .then(response => {
      marketplacemetering = new AWS.MarketplaceMetering({
        region: response.data.region
      })
    })
    .catch(error => {
      pino.error({
        type: 'registerUsage',
        error: error,
      })
      marketplacemetering = new AWS.MarketplaceMetering({
        region: 'us-east-1'
      })
    }).then ( response => {
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
