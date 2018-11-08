const settings = require('../../settings')

const remotes = {
  s3: require('./s3')
}

const RemoteFactory = (opts) => {
  const Remote = remotes[settings.remoteType] || remotes.s3
  return Remote(opts)
}

module.exports = RemoteFactory