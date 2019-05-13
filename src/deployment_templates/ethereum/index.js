const geth_1_8 = require('./geth-1.8/form')

module.exports = {
  forms: {
    geth_1_8,
  },
  button: {
    title: 'Ethereum',
    versions: [{
      title: 'Geth 1.8',
      form: 'geth_1_8',
    }],
  },
}