/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth

const edition = {
  deployment: {
    classic: ['daml'],
    helm: []
  },
  metering: {
    type: 'dev'
  },
}

module.exports = {
  edition
}
