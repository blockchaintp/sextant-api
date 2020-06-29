const version_1_1_form = require('./daml-on-sawtooth/form')
const version_1_1_summary = require('./daml-on-sawtooth/summary')

const daml_on_qldb_form = require('./daml-on-qldb/form')
const daml_on_qldb_summary = require('./daml-on-qldb/summary')

const daml_on_postgres_form = require('./daml-on-postgres/form')
const daml_on_postgres_summary = require('./daml-on-postgres/summary')



module.exports = {
  forms: {
    'daml-on-sawtooth': version_1_1_form,
    'daml-on-qldb': daml_on_qldb_form,
    'daml-on-postgres': daml_on_postgres_form,
  },
  summary: {
    'daml-on-sawtooth': version_1_1_summary,
    'daml-on-qldb': daml_on_qldb_summary,
    'daml-on-postgres': daml_on_postgres_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    'daml-on-sawtooth': {
      name: 'sawtooth.networkName',
      namespace: 'sawtooth.namespace',
    },
    'daml-on-qldb': {
      name: 'deployment.name',
      namespace: 'deployment.namespace',
    },
    'daml-on-postgres': {
      name: 'deployment.name',
      namespace: 'deployment.namespace',
    },  
  },
  button: {
    versions: [
      {
        title: 'DAML on Sawtooth',
        icon: "/thirdParty/daml.png",
        version: 'daml-on-sawtooth(~0.1.4), BTP Sawtooth(BTP2.0), DAML 0.13.41',
        form: 'daml-on-sawtooth',
        description: "The DAML smart contract runtime engine with Hyperledger Sawtooth as the ledger.",
        features: [
          "daml.parties",
          "daml.archives"
        ]
      }, {
        title: 'DAML on QLDB',
        icon: "/thirdParty/daml.png",
        version: 'daml-on-qldb(Early Access), AWS QLDB, DAML 0.13.41',
        form: 'daml-on-qldb',
        description: "The DAML smart contract runtime engine with AWS QLDB as the ledger.",
        features: [
          "daml.parties",
          "daml.archives"
        ]
      },{
        title: 'DAML on Aurora',
        icon: "/thirdParty/daml.png",
        version: 'daml-on-postgres(0.13.41), AWS Aurora(Postgresql), DAML 0.13.41',
        form: 'daml-on-postgres',
        description: "The DAML smart contract runtime engine with AWS Aurora(Postgresql) as the ledger.",
        features: [
          "daml.parties",
          "daml.archives"
        ]
      },
    ],
  },
}
