const options = require('./options')

const getConsensusTitle = (value) => {
  const option = options.consensus.find(o => o.value == value)
  return option ? option.title : 'unknown'
}

const summary = (values) => {

  const {
    deployment,
    daml
  } = values

  return [{
    title: 'Network Name',
    value: deployment.name,
  }, {
    title: 'Namespace',
    value: deployment.namespace,
    }, {
      title: 'DAML DB Connection Secret',
      value: daml.postgres.secret,
    },{
      title: 'DAML Ledger ID',
      value: daml.ledgerId,
  }]
}

module.exports = summary
