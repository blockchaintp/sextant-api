/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth

const edition = {
  deployment: {
    types: ['daml']
  },
  metering: {
    type: 'aws',
    productCode: '53zb45lxmkh0qyk0skmuipl9a',
    publicKeyVersion: 1,
  },
}

module.exports = {
  edition
}
