/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth

const edition = {
  deployment: {
    classic: [],
    helm: [
      'sawtooth',
      'nginx-ingress',
      'openebs',
    ],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
      charts: [
        'sawtooth',
        'nginx-ingress',
        'openebs',
      ],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', extension: 'sawtooth' },
    },
    openebs: {
      2.0: { chart: 'btp-unstable/openebs', extension: 'openebs' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-unstable/nginx-ingress', extension: 'ingress' },
    },
  },
}

module.exports = {
  edition,
}
