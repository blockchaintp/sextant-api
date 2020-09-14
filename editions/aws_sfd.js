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
      name: 'btp-unstable',
      url: 'https://btp-charts-unstable.s3.amazonaws.com/charts',
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
      1.3: { chart: 'btp-unstable/daml-on-besu', extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-unstable/daml-on-postgres', extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-unstable/daml-on-sawtooth', extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-unstable/daml-on-qldb', extension: 'daml' },
    },
    openebs: {
      2.0: { chart: 'btp-unstable/openebs', extension: 'openebs' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-unstable/nginx-ingress', extension: 'ingress' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-unstable/postgresql-ha', extension: 'pgsql' },
    },
  },
}

module.exports = {
  edition,
}
