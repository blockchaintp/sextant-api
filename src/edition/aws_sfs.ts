/* eslint-disable import/prefer-default-export */
// Edition object for Sawtooth
import { edition as AWSSFSNoMeter } from './aws_sfs_nometer'
import DEPLOYMENT_SPEC from './deployment'

export const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: {
    type: 'aws',
    productCode: '965zq9jyoo7ry5e2cryolgi2l',
    publicKeyVersion: 1,
  },
  helmRepos: AWSSFSNoMeter.helmRepos,
  chartTable: AWSSFSNoMeter.chartTable,
}
