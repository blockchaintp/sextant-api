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
        order: 2,
        extension: 'sawtooth',
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        chart: 'btp-unstable/tfs-on-sawtooth',
        order: 1,
        extension: 'tfs',
      },
    },
  },
};

module.exports = {
  edition,
};
