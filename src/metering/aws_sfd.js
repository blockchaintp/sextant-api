'use strict'
const axios = require('axios');

const AWS = require('aws-sdk');
const pino = require('pino')({
  name: 'metering.ecs',
})

//Sextant for DAML
const PRODUCT_CODE = '53zb45lxmkh0qyk0skmuipl9a'
const PUBLIC_KEY_VERSION = 1

// 10 minutes
const LOOP_DELAY = 1000 * 60 * 10

// get region of aws cluster
axios.get('http://169.254.169.254/latest/dynamic/instance-identity/document')
    .then(response => {
      const marketplacemetering = new AWS.MarketplaceMetering({
        region: response.data.region
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
    })
    .catch(error => {
      console.log(error);
    });
