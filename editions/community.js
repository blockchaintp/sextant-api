// Edition object for community edition (sawtooth+DAML)

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
        chartVersion: '~0.0.8',
        order: 1,
        extension: 'besu',
      },
    },
    sawtooth: {
      1.1: {
        chart: 'btp-stable/sawtooth',
        chartVersion: '~0.2.0',
        order: 2,
        extension: 'sawtooth',
      },
    },
    'daml-on-besu': {
      1.3: {
        chart: 'btp-stable/daml-on-besu',
        chartVersion: '~0.0.32',
        order: 3,
        extension: 'daml',
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        chart: 'btp-stable/daml-on-sawtooth',
        chartVersion: '~0.2.0',
        order: 4,
        extension: 'daml',
      },
    },
  },
}

module.exports = {
  edition,
}
