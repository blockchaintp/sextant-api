const version_0_1_form = require('./0.1/form')
const version_0_1_summary = require('./0.1/summary')

module.exports = {
  forms: {
    '0.1': version_0_1_form,
  },
  summary: {
    '0.1': version_0_1_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    '0.1': {
      name: 'sawtooth.networkName',
      namespace: 'sawtooth.namespace',
    },
  },
  button: {
    versions: [
      {
        title: 'Taekion Sawtooth',
        icon: "/thirdParty/taekion.png",
        version: 'TAEKION0.1',
        form: '0.1',
        description: "BTP's Taekion distribution based on Hyperledger Sawtooth 1.1",
        features: [
          'taekion.keys',
          'taekion.volumes',
          'taekion.snapshots',
        ]
      },
    ],
  },
}
