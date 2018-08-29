const args = require('minimist')(process.argv, {
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || '/api/v1',
  }
})

module.exports = args