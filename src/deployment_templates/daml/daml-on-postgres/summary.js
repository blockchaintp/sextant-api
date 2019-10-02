const options = require('./options')

const getConsensusTitle = (value) => {
  const option = options.consensus.find(o => o.value == value)
  return option ? option.title : 'unknown'
}

const summary = (values) => {

  const {
    sawtooth,
  } = values

  return [{
    title: 'Network Name',
    value: sawtooth.networkName,
  }, {
    title: 'Namespace',
    value: sawtooth.namespace,
    }, {
      title: 'DAML DB Connection Secret',
      value: daml.postgres.secret,
    },{
      title: 'DAML Ledger ID',
      value: daml.postgres.ledgerId,
  }]
}

module.exports = summary
