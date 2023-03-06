/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth
import { Edition } from './edition-type'

export const edition: Edition = {
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
        chartVersion: '~0.1.27',
        order: 1,
        extension: 'sawtooth',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-stable/openebs',
        chartVersion: '~2.0.2',
        order: 4,
        extension: 'openebs',
      },
    },
    'nginx-ingress': {
      1.8: {
        chart: 'btp-stable/nginx-ingress',
        chartVersion: '~0.0.1',
        order: 3,
        extension: 'ingress',
      },
    },
    besu: {
      1.4: {
        chart: 'btp-stable/besu',
        chartVersion: '~0.0.8',
        order: 2,
        extension: 'besu',
      },
    },
  },
}
