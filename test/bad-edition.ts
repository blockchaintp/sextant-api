// Edition object for testing purposes.
// The helmRepos url is not a valid repository.

import { Edition } from '../src/edition-type'

export const badEdition: Edition = {
  deployment: {
    classic: [],
  },
  metering: {
    type: 'dev',
  },
  helmRepos: [
    {
      name: 'btp-example',
      url: 'https://btp-charts-unstable.example.com/charts',
    },
  ],
  chartTable: {},
}
