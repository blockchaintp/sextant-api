/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth

const edition = {
  deployment: {
    classic: [],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: {
        chart: 'btp-stable/sawtooth',
        order: 1,
        extension: 'sawtooth',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-stable/openebs',
        order: 4,
        extension: 'openebs',
      },
    },
    'nginx-ingress': {
      1.8: {
        chart: 'btp-stable/nginx-ingress',
        order: 3,
        extension: 'ingress',
      },
    },
    besu: {
      1.4: {
        chart: 'btp-stable/besu',
        order: 2,
        extension: 'besu',
      },
    },
  },
}

module.exports = {
  edition,
}
