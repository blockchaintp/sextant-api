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
      'elasticsearch',
      'fluentd',
      'kibana',
      'openebs',
      'sawtooth',
      'sextant',
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
        'elasticsearch',
        'fluentd',
        'kibana',
        'openebs',
        'sawtooth',
        'sextant',
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
      2.1: { chart: 'btp-unstable/sextant', extension: 'sextant'},
    },
  },
};

module.exports = {
  edition,
};
