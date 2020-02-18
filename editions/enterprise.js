/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for enterprise editions (sawtooth+DAML)

const edition = {
  deployment: {
    types: ['daml', 'sawtooth']
  },
  metering: {
    type: 'dev'
  },
}

module.exports = {
  edition
}
