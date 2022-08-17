/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth
const repositories = require('./charts/repositories')
const DEPLOYMENT_SPEC = require('./deployment')

const aws_sfd_nometer = require('./aws_sfd_nometer')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: {
    type: 'aws',
    productCode: '53zb45lxmkh0qyk0skmuipl9a',
    publicKeyVersion: 1,
  },
  helmRepos: [repositories.BTP_STABLE],
  chartTable: aws_sfd_nometer.edition.chartTable,
}

module.exports = {
  edition,
}
