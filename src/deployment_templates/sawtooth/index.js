const version_1_0_form = require('./1.0.5/form')
const version_1_0_summary = require('./1.0.5/summary')
const version_1_1_form = require('./1.1/form')
const version_1_1_summary = require('./1.1/summary')
const version_1_2_form = require('./1.2/form')
const version_1_2_summary = require('./1.2/summary')

module.exports = {
  forms: {
    '1.0': version_1_0_form,
    '1.1': version_1_1_form,
    '1.2': version_1_2_form,
  },
  summary: {
    '1.0': version_1_0_summary,
    '1.1': version_1_1_summary,
    '1.2': version_1_2_summary,
  },
  // paths to specific fields in the deployment
  paths: {
    '1.0': {
      name: 'sawtooth.networkName',
    },
    '1.1': {
      name: 'sawtooth.networkName',
    },
    '1.2': {
      name: 'sawtooth.networkName',
    },
  },
  button: {
    title: 'Sawtooth',
    versions: [{
      title: 'Version 1.0 (BTP1)',
      form: '1.0',
    },{
      title: 'Version 1.1 (BTP2)',
      form: '1.1',
    },{
      title: 'Version 1.2',
      form: '1.2',
    }],
  },
}