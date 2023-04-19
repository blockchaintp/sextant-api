/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth
import { Edition } from './edition-type'

export const edition: Edition = {
  deployment: {
    classic: [],
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
    },
  ],
  chartTable: {
    'daml-on-besu': {
      '1.3': {
        chart: 'btp-stable/daml-on-besu',
        chartVersion: '~0.0.32',
        order: 1,
        extension: 'daml',
      },
    },
    'daml-on-postgres': {
      '1.3': {
        chart: 'btp-stable/daml-on-postgres',
        chartVersion: '~0.1.1',
        order: 4,
        extension: 'daml',
      },
    },
    'daml-on-sawtooth': {
      '1.3': {
        chart: 'btp-stable/daml-on-sawtooth',
        chartVersion: '~0.1.56',
        order: 2,
        extension: 'daml',
      },
    },
    'daml-on-qldb': {
      '1.3': {
        chart: 'btp-stable/daml-on-qldb',
        chartVersion: '~0.0.9',
        order: 3,
        extension: 'daml',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-stable/openebs',
        chartVersion: '~2.0.2',
        order: 7,
        extension: 'openebs',
      },
    },
    'nginx-ingress': {
      '1.8': {
        chart: 'btp-stable/nginx-ingress',
        chartVersion: '~0.0.1',
        order: 6,
        extension: 'ingress',
      },
    },
    'postgresql-ha': {
      '11.9': {
        chart: 'btp-stable/postgresql-ha',
        chartVersion: '~0.0.1',
        order: 5,
        extension: 'pgsql',
      },
    },
  },
}
