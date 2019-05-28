const geth_1_8 = require('./geth-1.8/form')

module.exports = {
  forms: {
    'geth-1.8': geth_1_8,
  },
  button: {
    title: 'Ethereum',
    versions: [{
      title: 'Geth 1.8',
      form: 'geth-1.8',
    }],
  },
}