import { SextantEdition } from './types'

/* eslint-disable global-require */
function getEdition(): { edition: SextantEdition } {
  switch (process.env.MODULE || 'dev') {
    case 'aws_sfd_nometer':
      return require('./aws_sfd_nometer')
    case 'aws_sfd':
      return require('./aws_sfd')
    case 'aws_sfs_nometer':
      return require('./aws_sfs_nometer')
    case 'aws_sfs':
      return require('./aws_sfs')
    case 'community':
      return require('./community')
    case 'enterprise':
      return require('./enterprise')
    case 'sft':
      return require('./sft')
    case 'dev':
    default:
      return require('./dev')
  }
}

// eslint-disable-next-line import/prefer-default-export
export const { edition } = getEdition()
