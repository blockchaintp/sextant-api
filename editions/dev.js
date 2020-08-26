// Edition object for dev mode
const dotenv = require('dotenv');

dotenv.config();

const edition = {
  deployment: {
    classic: ['daml', 'taekion'],
    helm: [
      'besu',
      'daml-on-besu',
      'daml-on-postgres',
      'daml-on-sawtooth',
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
      ],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-unstable/sawtooth', extension: 'sawtooth' },
    },
    'daml-on-besu': {
      1.3: { chart: 'btp-unstable/daml-on-besu', extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-unstable/daml-on-postgres', extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-unstable/daml-on-sawtooth', extension: 'daml' },
    },
    openebs: {
      2.0: { chart: 'btp-unstable/openebs', extension: 'openebs' },
    },
    fluentd: {
      1.11: { chart: 'btp-unstable/fluentd', extension: 'fluentd' },
    },
    elasticsearch: {
      7.9: { chart: 'btp-unstable/elasticsearch', extension: 'elasticsearch' },
    },
    kibana: {
      7.8: { chart: 'btp-unstable/kibana', extension: 'kibana' },
    },
    besu: {
      1.4: { chart: 'btp-unstable/besu', extension: 'besu' },
    },
    sextant: {
      2.1: { chart: 'btp-unstable/sextant', extension: 'sextant' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-unstable/nginx-ingress', extension: 'ingress' },
    },
    grafana: {
      7.1: { chart: 'btp-unstable/grafana', extension: 'grafana' },
    },
    vault: {
      1.5: { chart: 'btp-unstable/vault', extension: 'vault' },
    },
    influxdb: {
      1.8: { chart: 'btp-unstable/influxdb', extension: 'influxdb' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-unstable/postgresql-ha', extension: 'pgsql' },
    },
  },
};

module.exports = {
  edition,
};
