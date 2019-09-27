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
    title: 'DAML on Sawtooth',
    icon: "/thirdParty/hyperledger-sawtooth.png",
    versions: [
    {
      title: 'daml-on-sawtooth(v0.1.3), Sawtooth v1.1(BTP2.0)',
      form: '1.1',
      description: "The DAML smart contract runtime engine with Hyperledger Sawtooth as the backing DLT.",
    },
  ],
  },
}
