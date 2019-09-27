const version_1_1_form = require('./daml-on-sawtooth/form')
const version_1_1_summary = require('./daml-on-sawtooth/summary')

module.exports = {
  forms: {
    'daml-on-sawtooth': version_1_1_form,
  },
  summary: {
    'daml-on-sawtooth': version_1_1_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    'daml-on-sawtooth': {
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
      form: 'daml-on-sawtooth',
      description: "The DAML smart contract runtime engine with Hyperledger Sawtooth as the backing DLT.",
    },
  ],
  },
}
