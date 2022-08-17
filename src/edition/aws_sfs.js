// Edition object for Sawtooth
const repositories = require('./charts/repositories')
const DEPLOYMENT_SPEC = require('./deployment')

const aws_sfs_nometer = require('./aws_sfs_nometer')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: {
    type: 'aws',
    productCode: '965zq9jyoo7ry5e2cryolgi2l',
    publicKeyVersion: 1,
  },
  helmRepos: [repositories.BTP_STABLE],
  chartTable: aws_sfs_nometer.edition.chartTable,
}

module.exports = {
  edition,
}
