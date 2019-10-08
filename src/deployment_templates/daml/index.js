const version_1_1_form = require('./daml-on-sawtooth/form')
const version_1_1_summary = require('./daml-on-sawtooth/summary')

const daml_on_postgres_form = require('./daml-on-postgres/form')
const daml_on_postgres_summary = require('./daml-on-postgres/summary')

module.exports = {
  forms: {
    'daml-on-sawtooth': version_1_1_form,
    'daml-on-postgres': daml_on_postgres_form,
  },
  summary: {
    'daml-on-sawtooth': version_1_1_summary,
    'daml-on-postgres': daml_on_postgres_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    'daml-on-sawtooth': {
      name: 'sawtooth.networkName',
      namespace: 'sawtooth.namespace',
    },
    'daml-on-postgres': {
      name: 'deployment.networkName',
      namespace: 'deployment.namespace',
    },
  },
  button: {
    versions: [
      {
        title: 'DAML on Sawtooth',
        icon: "/thirdParty/daml.png",
        version: 'daml-on-sawtooth(v0.1.3), BTP Sawtooth(BTP2.0)',
        form: 'daml-on-sawtooth',
        description: "The DAML smart contract runtime engine with Hyperledger Sawtooth as the backing DLT.",
        features: [
          "daml.parties",
          "daml.archives"
        ]
      },{
        title: 'DAML on Aurora',
        icon: "/thirdParty/daml.png",
        version: 'daml-on-postgres(v0.1.3), AWS Aurora(Postgresql)',
        form: 'daml-on-postgres',
        description: "The DAML smart contract runtime engine with AWS Aurora as the backing DLT.",
        features: [
          "daml.parties",
          "daml.archives"
        ]
      }
    ],
  },
}
