// Edition object for Sawtooth

const edition = {
  deployment: {
    classic: [],
    helm: ['sawtooth']
  },
  metering: {
    type: 'aws',
    productCode: '965zq9jyoo7ry5e2cryolgi2l',
    publicKeyVersion: 1,
  },
  helmRepos: [
    {
      name: 'btp-stable',
      url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
      charts: ['sawtooth',]
    }
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-stable/sawtooth', extension: 'sawtooth' }
    },
  },
}

module.exports = {
  edition
}
