const ACCESS_LEVELS = {
  read: 1,
  write: 2,
  admin: 3,
}

const config = {
  baseUrl: '/api/v1',
  sessionSecret: 'sextant-blockchain',
  tokenSecret: 'sextant-blockchain',
  ACCESS_LEVELS,
}

module.exports = config