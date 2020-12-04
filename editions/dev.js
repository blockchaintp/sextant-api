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
      1.4: { chart: 'btp-unstable/besu', order: 1, extension: 'besu' },
    },
    sawtooth: {
      1.1: { chart: 'btp-unstable/sawtooth', order: 2, extension: 'sawtooth' },
    },
    'daml-on-besu': {
      1.3: { chart: 'btp-unstable/daml-on-besu', order: 3, extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-unstable/daml-on-sawtooth', order: 4, extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-unstable/daml-on-qldb', order: 5, extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-unstable/daml-on-postgres', order: 6, extension: 'daml' },
    },
    'tfs-on-sawtooth': {
      0.1: { chart: 'btp-unstable/tfs-on-sawtooth', order: 7, extension: 'tfs' },
    },
    sextant: {
      2.1: { chart: 'btp-unstable/sextant', order: 8, extension: 'sextant' },
    },
    elasticsearch: {
      7.9: { chart: 'btp-unstable/elasticsearch', order: 9, extension: 'elasticsearch' },
    },
    fluentd: {
      1.11: { chart: 'btp-unstable/fluentd', order: 10, extension: 'fluentd' },
    },
    kibana: {
      7.8: { chart: 'btp-unstable/kibana', order: 11, extension: 'kibana' },
    },
    grafana: {
      7.1: { chart: 'btp-unstable/grafana', order: 12, extension: 'grafana' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-unstable/postgresql-ha', order: 13, extension: 'pgsql' },
    },
    openebs: {
      '2.0': { chart: 'btp-unstable/openebs', order: 14, extension: 'openebs' },
    },
    influxdb: {
      1.8: { chart: 'btp-unstable/influxdb', order: 15, extension: 'influxdb' },
    },
    vault: {
      1.5: { chart: 'btp-unstable/vault', order: 16, extension: 'vault' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-unstable/nginx-ingress', order: 17, extension: 'ingress' },
    },
  },
};

module.exports = {
  edition,
};
