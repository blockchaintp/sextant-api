// Edition object for enterprise editions (sawtooth+DAML)
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
    'chronicle-on-sawtooth': {
      '1.3': {
        chart: 'btp-stable/chronicle-on-sawtooth',
        chartVersion: '~0.1.1',
        order: 1,
        extension: 'chronicle',
      },
    },
    besu: {
      '1.4': {
        chart: 'btp-stable/besu',
        chartVersion: '~0.0.8',
        order: 1,
        extension: 'besu',
      },
    },
    sawtooth: {
      '1.1': {
        chart: 'btp-stable/sawtooth',
        chartVersion: '~0.2.0',
        order: 2,
        extension: 'sawtooth',
      },
    },
    'daml-on-besu': {
      '1.3': {
        chart: 'btp-stable/daml-on-besu',
        chartVersion: '~0.0.32',
        order: 3,
        extension: 'daml',
      },
    },
    'daml-on-sawtooth': {
      '1.3': {
        chart: 'btp-stable/daml-on-sawtooth',
        chartVersion: '~0.2.0',
        order: 4,
        extension: 'daml',
      },
    },
    'daml-on-qldb': {
      '1.3': {
        chart: 'btp-stable/daml-on-qldb',
        chartVersion: '~0.0.9',
        order: 5,
        extension: 'daml',
      },
    },
    'daml-on-postgres': {
      '1.3': {
        chart: 'btp-stable/daml-on-postgres',
        chartVersion: '~0.1.1',
        order: 6,
        extension: 'daml',
      },
    },
    'tfs-on-sawtooth': {
      '0.1': {
        chart: 'btp-stable/tfs-on-sawtooth',
        chartVersion: '~0.6.0',
        order: 7,
        extension: 'tfs',
      },
    },
    elasticsearch: {
      '7.9': {
        chart: 'btp-stable/elasticsearch',
        chartVersion: '~12.6.3',
        order: 9,
        extension: 'elasticsearch',
      },
    },
    fluentd: {
      '1.11': {
        chart: 'btp-stable/fluentd',
        chartVersion: '~1.3.1',
        order: 10,
        extension: 'fluentd',
      },
    },
    kibana: {
      '7.8': {
        chart: 'btp-stable/kibana',
        chartVersion: '~5.3.9',
        order: 11,
        extension: 'kibana',
      },
    },
    influxdb: {
      '1.8': {
        chart: 'btp-stable/influxdb',
        chartVersion: '~0.0.2',
        order: 12,
        extension: 'influxdb',
      },
    },
    grafana: {
      '7.1': {
        chart: 'btp-stable/grafana',
        chartVersion: '~0.0.2',
        order: 13,
        extension: 'grafana',
      },
    },
    'postgresql-ha': {
      '11.9': {
        chart: 'btp-stable/postgresql-ha',
        chartVersion: '~0.0.1',
        order: 14,
        extension: 'pgsql',
      },
    },
    'nginx-ingress': {
      '1.8': {
        chart: 'btp-stable/nginx-ingress',
        chartVersion: '~0.0.1',
        order: 15,
        extension: 'ingress',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-stable/openebs',
        chartVersion: '~2.0.2',
        order: 16,
        extension: 'openebs',
      },
    },
    vault: {
      '1.5': {
        chart: 'btp-stable/vault',
        chartVersion: '~0.0.2',
        order: 17,
        extension: 'vault',
      },
    },
  },
}
