// Edition object for dev mode
const dotenv = require('dotenv');

dotenv.config();

const edition = {
  deployment: {
    classic: [],
    helm: [
      'besu',
      'daml-on-besu',
      'daml-on-postgres',
      'daml-on-sawtooth',
      'daml-on-qldb',
      'elasticsearch',
      'fluentd',
      'grafana',
      'influxdb',
      'kibana',
      'nginx-ingress',
      'openebs',
      'postgresql-ha',
      'sawtooth',
      'sextant',
      'vault',
      'tfs-on-sawtooth',
    ],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-unstable',
      url: 'https://btp-charts-unstable.s3.amazonaws.com/charts',
      charts: [
        'besu',
        'daml-on-besu',
        'daml-on-postgres',
        'daml-on-sawtooth',
        'daml-on-qldb',
        'elasticsearch',
        'fluentd',
        'grafana',
        'influxdb',
        'kibana',
        'nginx-ingress',
        'openebs',
        'postgresql-ha',
        'sawtooth',
        'sextant',
        'vault',
        'tfs-on-sawtooth',
      ],
    },
  ],
  chartTable: {
    besu: {
      1.4: { chart: 'btp-stable/besu', order: 1, extension: 'besu' },
    },
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', order: 2, extension: 'sawtooth' },
    },
    'daml-on-besu': {
      1.3: { chart: 'btp-stable/daml-on-besu', order: 3, extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-stable/daml-on-sawtooth', order: 4, extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-stable/daml-on-qldb', order: 5, extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-stable/daml-on-postgres', order: 6, extension: 'daml' },
    },
    'tfs-on-sawtooth': {
      0.1: { chart: 'btp-unstable/tfs-on-sawtooth', order: 7, extension: 'tfs' },
    },
    sextant: {
      2.1: { chart: 'btp-stable/sextant', order: 8, extension: 'sextant' },
    },
    openebs: {
      '2.0': { chart: 'btp-stable/openebs', order: 9, extension: 'openebs' },
    },
    fluentd: {
      1.11: { chart: 'btp-stable/fluentd', order: 10, extension: 'fluentd' },
    },
    elasticsearch: {
      7.9: { chart: 'btp-stable/elasticsearch', order: 11, extension: 'elasticsearch' },
    },
    kibana: {
      7.8: { chart: 'btp-stable/kibana', order: 12, extension: 'kibana' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-stable/nginx-ingress', order: 13, extension: 'ingress' },
    },
    grafana: {
      7.1: { chart: 'btp-stable/grafana', order: 14, extension: 'grafana' },
    },
    vault: {
      1.5: { chart: 'btp-stable/vault', order: 15, extension: 'vault' },
    },
    influxdb: {
      1.8: { chart: 'btp-stable/influxdb', order: 16, extension: 'influxdb' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-stable/postgresql-ha', order: 17, extension: 'pgsql' },
    },
  },
};

module.exports = {
  edition,
};
