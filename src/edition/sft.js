// Edition object for SFT editions (sawtooth+TFS)

const edition = {
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
    sawtooth: {
      1.1: {
        chart: 'btp-unstable/sawtooth',
        chartVersion: '~0.2.0',
        order: 2,
        extension: 'sawtooth',
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        chart: 'btp-unstable/tfs-on-sawtooth',
        chartVersion: '~0.6.0',
        order: 1,
        extension: 'tfs',
      },
    },
    'nginx-ingress': {
      1.8: {
        chart: 'btp-unstable/nginx-ingress',
        chartVersion: '~0.0.1',
        order: 3,
        extension: 'ingress',
      },
    },
  },
}

module.exports = {
  edition,
}
