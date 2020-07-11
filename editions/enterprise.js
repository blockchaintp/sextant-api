// Edition object for enterprise editions (sawtooth+DAML)

const edition = {
  deployment: {
    classic: ['daml'],
    helm: ['sawtooth']
  },
  metering: {
    type: 'dev'
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
