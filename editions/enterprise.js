// Edition object for enterprise editions (sawtooth+DAML)

const edition = {
  deployment: {
    classic: ['daml', 'sawtooth'],
    helm: []
  },
  metering: {
    type: 'dev'
  },
}

module.exports = {
  edition
}
