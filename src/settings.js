/*

  the settings passed in via the command line or environment
  
*/
const args = require('minimist')(process.argv, {
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || '/api/v1',
    fileStoreFolder: process.env.SEXTANT_FILE_STORE_FOLDER || '/var/lib/sextant-api/filestore',
  }
})

module.exports = args