// Edition object for SFT editions (sawtooth+TFS)

const edition = {
  deployment: {
    classic: [],
    helm: [
      'sawtooth',
      'tfs-on-sawtooth',
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
        'sawtooth',
        'tfs-on-sawtooth',
      ],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', order: 1, extension: 'sawtooth' },
    },
    'tfs-on-sawtooth': {
      0.1: { chart: 'btp-unstable/tfs-on-sawtooth', order: 2, extension: 'tfs' },
    },
  },
};

module.exports = {
  edition,
};
