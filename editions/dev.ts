// Edition object for dev mode
import { Edition } from './edition-type'
import * as dotenv from 'dotenv'

dotenv.config()

export const edition: Edition = {
  deployment: {
    classic: [],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-unstable',
      url: 'https://btp-charts-unstable.s3.amazonaws.com/charts',
    },
  ],
  chartTable: {
    'chronicle-on-sawtooth': {
      1.3: {
        chart: 'btp-unstable/chronicle-on-sawtooth',
        chartVersion: '~0.1.1',
        order: 1,
        extension: 'chronicle',
      },
    },
    besu: {
      1.4: {
        chart: 'btp-unstable/besu',
        chartVersion: '~0.0.8',
        order: 2,
        extension: 'besu',
      },
    },
    sawtooth: {
      1.1: {
        chart: 'btp-unstable/sawtooth',
        chartVersion: '~0.2.0',
        order: 3,
        extension: 'sawtooth',
      },
    },
    'daml-on-besu': {
      1.3: {
        chart: 'btp-unstable/daml-on-besu',
        chartVersion: '~0.0.32',
        order: 4,
        extension: 'daml',
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        chart: 'btp-unstable/daml-on-sawtooth',
        chartVersion: '~0.2.0',
        order: 5,
        extension: 'daml',
      },
    },
    'daml-on-qldb': {
      1.3: {
        chart: 'btp-unstable/daml-on-qldb',
        chartVersion: '~0.0.9',
        order: 6,
        extension: 'daml',
      },
    },
    'daml-on-postgres': {
      1.3: {
        chart: 'btp-unstable/daml-on-postgres',
        chartVersion: '~0.1.1',
        order: 7,
        extension: 'daml',
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        chart: 'btp-unstable/tfs-on-sawtooth',
        chartVersion: '~0.6.0',
        order: 8,
        extension: 'tfs',
      },
    },
    sextant: {
      2.1: {
        chart: 'btp-unstable/sextant',
        chartVersion: '~2.1.8',
        order: 9,
        extension: 'sextant',
      },
    },
    elasticsearch: {
      7.9: {
        chart: 'btp-unstable/elasticsearch',
        chartVersion: '~12.6.3',
        order: 10,
        extension: 'elasticsearch',
      },
    },
    fluentd: {
      1.11: {
        chart: 'btp-unstable/fluentd',
        chartVersion: '~1.3.1',
        order: 11,
        extension: 'fluentd',
      },
    },
    kibana: {
      7.8: {
        chart: 'btp-unstable/kibana',
        chartVersion: '~5.3.9',
        order: 12,
        extension: 'kibana',
      },
    },
    influxdb: {
      1.8: {
        chart: 'btp-unstable/influxdb',
        chartVersion: '~0.0.2',
        order: 13,
        extension: 'influxdb',
      },
    },
    grafana: {
      7.1: {
        chart: 'btp-unstable/grafana',
        chartVersion: '~0.0.2',
        order: 14,
        extension: 'grafana',
      },
    },
    'postgresql-ha': {
      11.9: {
        chart: 'btp-unstable/postgresql-ha',
        chartVersion: '~0.0.1',
        order: 15,
        extension: 'pgsql',
      },
    },
    'nginx-ingress': {
      1.8: {
        chart: 'btp-unstable/nginx-ingress',
        chartVersion: '~0.0.1',
        order: 16,
        extension: 'ingress',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-unstable/openebs',
        chartVersion: '~2.0.2',
        order: 17,
        extension: 'openebs',
      },
    },
    vault: {
      1.5: {
        chart: 'btp-unstable/vault',
        chartVersion: '~0.0.2',
        order: 18,
        extension: 'vault',
      },
    },
  },
}
