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
      'a_sawtooth',
      'besu',
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
      url: 'https://btp-charts-unstable.s3.amazonaws.com/charts',
      charts: [
        'besu',
        'sawtooth',
        'nginx-ingress',
        'openebs',
      ],
    },
  ],
  chartTable: {
    a_sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', extension: 'sawtooth' },
    },
    besu: {
      1.4: { chart: 'btp-unstable/besu', extension: 'besu' },
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
