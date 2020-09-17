// Edition object for SFT editions (sawtooth+TFS)

const edition = {
  deployment: {
    classic: ['taekion'],
    helm: ['sawtooth'],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
      charts: ['sawtooth'],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', order: 1, extension: 'sawtooth' },
    },
  },
};

module.exports = {
  edition,
};
