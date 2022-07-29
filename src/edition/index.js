/* eslint-disable global-require */
switch (process.env_MODULE || 'dev') {
  case 'aws_sfd_nometer':
    module.exports = require('./aws_sfd_nometer')
    break
  case 'aws_sfd':
    module.exports = require('./aws_sfd')
    break
  case 'aws_sfs_nometer':
    module.exports = require('./aws_sfs_nometer')
    break
  case 'aws_sfs':
    module.exports = require('./aws_sfs')
    break
  case 'community':
    module.exports = require('./community')
    break
  case 'enterprise':
    module.exports = require('./enterprise')
    break
  case 'sft':
    module.exports = require('./sft')
    break
  default:
  case 'dev':
    module.exports = require('./dev')
    break
}
