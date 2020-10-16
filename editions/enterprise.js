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
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
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
      1.1: { chart: 'btp-stable/sawtooth', order: 1, extension: 'sawtooth' },
    },
    'daml-on-besu': {
      1.3: { chart: 'btp-stable/daml-on-besu', order: 2, extension: 'daml' },
    },
    'daml-on-postgres': {
      1.3: { chart: 'btp-stable/daml-on-postgres', order: 5, extension: 'daml' },
    },
    'daml-on-sawtooth': {
      1.3: { chart: 'btp-stable/daml-on-sawtooth', order: 3, extension: 'daml' },
    },
    'daml-on-qldb': {
      1.3: { chart: 'btp-stable/daml-on-qldb', order: 4, extension: 'daml' },
    },
    openebs: {
      '2.0': { chart: 'btp-stable/openebs', order: 6, extension: 'openebs' },
    },
    fluentd: {
      1.11: { chart: 'btp-stable/fluentd', order: 7, extension: 'fluentd' },
    },
    elasticsearch: {
      7.9: { chart: 'btp-stable/elasticsearch', order: 8, extension: 'elasticsearch' },
    },
    kibana: {
      7.8: { chart: 'btp-stable/kibana', order: 9, extension: 'kibana' },
    },
    besu: {
      1.4: { chart: 'btp-stable/besu', order: 10, extension: 'besu' },
    },
    sextant: {
      2.1: { chart: 'btp-stable/sextant', order: 11, extension: 'sextant' },
    },
    'nginx-ingress': {
      1.8: { chart: 'btp-stable/nginx-ingress', order: 12, extension: 'ingress' },
    },
    grafana: {
      7.1: { chart: 'btp-stable/grafana', order: 13, extension: 'grafana' },
    },
    vault: {
      1.5: { chart: 'btp-stable/vault', order: 14, extension: 'vault' },
    },
    influxdb: {
      1.8: { chart: 'btp-stable/influxdb', order: 15, extension: 'influxdb' },
    },
    'postgresql-ha': {
      11.9: { chart: 'btp-stable/postgresql-ha', order: 16, extension: 'pgsql' },
    },
  },
};

module.exports = {
  edition,
};
