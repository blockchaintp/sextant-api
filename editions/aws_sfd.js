/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth

const edition = {
  deployment: {
    classic: [],
    helm: [
      'daml-on-besu',
      'daml-on-postgres',
      'daml-on-sawtooth',
      'daml-on-qldb',
      'nginx-ingress',
      'openebs',
      'postgresql-ha',
    ],
  },
  metering: {
    type: 'aws',
    productCode: '53zb45lxmkh0qyk0skmuipl9a',
    publicKeyVersion: 1,
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
      charts: [
        'daml-on-besu',
        'daml-on-postgres',
        'daml-on-sawtooth',
        'daml-on-qldb',
        'nginx-ingress',
        'openebs',
        'postgresql-ha',
      ],
    },
  ],
  chartTable: {
    'daml-on-besu': {
      1.3: { chart: 'btp-stable/daml-on-besu', order: 1, extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-stable/daml-on-postgres', order: 2, extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-stable/daml-on-sawtooth', order: 3, extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-stable/daml-on-qldb', order: 4, extension: 'daml' },
    },
    openebs: {
      2.0: { chart: 'btp-stable/openebs', order: 7, extension: 'openebs' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-stable/nginx-ingress', order: 6, extension: 'ingress' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-stable/postgresql-ha', order: 5, extension: 'pgsql' },
    },
  },
}

module.exports = {
  edition,
}
