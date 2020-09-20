// Edition object for enterprise editions (sawtooth+DAML)

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
      ],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-unstable/sawtooth', order: 1, extension: 'sawtooth' },
    },
    'daml-on-besu': {
      1.3: { chart: 'btp-unstable/daml-on-besu', order: 2, extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-unstable/daml-on-postgres', order: 3, extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-unstable/daml-on-sawtooth', order: 4, extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-unstable/daml-on-qldb', order: 5, extension: 'daml' },
    },
    openebs: {
      2.0: { chart: 'btp-unstable/openebs', order: 6, extension: 'openebs' },
    },
    fluentd: {
      1.11: { chart: 'btp-unstable/fluentd', order: 7, extension: 'fluentd' },
    },
    elasticsearch: {
      7.9: { chart: 'btp-unstable/elasticsearch', order: 8, extension: 'elasticsearch' },
    },
    kibana: {
      7.8: { chart: 'btp-unstable/kibana', order: 9, extension: 'kibana' },
    },
    besu: {
      1.4: { chart: 'btp-unstable/besu', order: 10, extension: 'besu' },
    },
    sextant: {
      2.1: { chart: 'btp-unstable/sextant', order: 11, extension: 'sextant' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-unstable/nginx-ingress', order: 12, extension: 'ingress' },
    },
    grafana: {
      7.1: { chart: 'btp-unstable/grafana', order: 13, extension: 'grafana' },
    },
    vault: {
      1.5: { chart: 'btp-unstable/vault', order: 14, extension: 'vault' },
    },
    influxdb: {
      1.8: { chart: 'btp-unstable/influxdb', order: 15, extension: 'influxdb' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-unstable/postgresql-ha', order: 16, extension: 'pgsql' },
    },
  },
};

module.exports = {
  edition,
};
