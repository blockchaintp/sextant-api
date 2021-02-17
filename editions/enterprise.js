// Edition object for enterprise editions (sawtooth+DAML)

const edition = {
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
    besu: {
      1.4: {
        chart: 'btp-stable/besu',
        order: 1,
        extension: 'besu',
      },
    },
    sawtooth: {
      1.1: {
        chart: 'btp-stable/sawtooth',
        order: 2,
        extension: 'sawtooth',
      },
    },
    'daml-on-besu': {
      1.3: {
        chart: 'btp-stable/daml-on-besu',
        order: 3,
        extension: 'daml',
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        chart: 'btp-stable/daml-on-sawtooth',
        order: 4,
        extension: 'daml',
      },
    },
    'daml-on-qldb': {
      1.3: {
        chart: 'btp-stable/daml-on-qldb',
        order: 5,
        extension: 'daml',
      },
    },
    'daml-on-postgres': {
      1.3: {
        chart: 'btp-stable/daml-on-postgres',
        order: 6,
        extension: 'daml',
      },
    },
    sextant: {
      2.1: {
        chart: 'btp-stable/sextant',
        order: 7,
        extension: 'sextant',
      },
    },
    elasticsearch: {
      7.9: {
        chart: 'btp-stable/elasticsearch',
        order: 8,
        extension: 'elasticsearch',
      },
    },
    fluentd: {
      1.11: {
        chart: 'btp-stable/fluentd',
        order: 9,
        extension: 'fluentd',
      },
    },
    kibana: {
      7.8: {
        chart: 'btp-stable/kibana',
        order: 10,
        extension: 'kibana',
      },
    },
    influxdb: {
      1.8: {
        chart: 'btp-stable/influxdb',
        order: 11,
        extension: 'influxdb',
      },
    },
    grafana: {
      7.1: {
        chart: 'btp-stable/grafana',
        order: 12,
        extension: 'grafana',
      },
    },
    'postgresql-ha': {
      11.9: {
        chart: 'btp-stable/postgresql-ha',
        order: 13,
        extension: 'pgsql',
      },
    },
    'nginx-ingress': {
      1.8: {
        chart: 'btp-stable/nginx-ingress',
        order: 14,
        extension: 'ingress',
      },
    },
    openebs: {
      '2.0': {
        chart: 'btp-stable/openebs',
        order: 15,
        extension: 'openebs',
      },
    },
    vault: {
      1.5: {
        chart: 'btp-stable/vault',
        order: 16,
        extension: 'vault',
      },
    },

  },
};

module.exports = {
  edition,
};
