/* eslint-disable import/prefer-default-export */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

import { edition as AWSSFDNoMeter } from './aws_sfd_nometer'
import { EMPTY } from './deployment'
import { SextantEdition } from './types'

export const edition: SextantEdition = {
  deployment: EMPTY,
  metering: {
    type: 'aws',
    productCode: '53zb45lxmkh0qyk0skmuipl9a',
    publicKeyVersion: 1,
  },
  helmRepos: AWSSFDNoMeter.helmRepos,
  chartTable: AWSSFDNoMeter.chartTable,
}
