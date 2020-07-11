/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth

const edition = {
  deployment: {
    types: ['sawtooth']
  },
  metering: {
    type: 'dev'
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
      charts: ['sawtooth',]
    }
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', extension: 'sawtooth' }
    },
  },
}

module.exports = {
  edition
}
