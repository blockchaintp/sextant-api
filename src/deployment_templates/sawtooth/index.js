const version_1_1_form = require('./1.1/form')
const version_1_1_summary = require('./1.1/summary')

module.exports = {
  forms: {
    '1.1': version_1_1_form,
  },
  summary: {
    '1.1': version_1_1_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    '1.1': {
      name: 'sawtooth.networkName',
      namespace: 'sawtooth.namespace',
    },
  },
  button: {
    versions: [
      {
        title: 'BTP Sawtooth',
        icon: "/thirdParty/hyperledger-sawtooth.png",
        version: 'BTP2.0',
        form: '1.1',
        description: "BTP's Sawtooth distribution based on Hyperledger Sawtooth 1.1",
        features: [
          "sawtooth.identity"
        ]
      },
    ],
  },
}
