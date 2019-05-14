const version_1_2_form = require('./1.2/form')
const version_1_2_summary = require('./1.2/summary')

module.exports = {
  forms: {
    '1.2': version_1_2_form,
  },
  summary: {
    '1.2': version_1_2_summary,
  },
  button: {
    title: 'Sawtooth',
    versions: [{
      title: 'Version 1.2',
      form: '1.2',
    }],
  },
}