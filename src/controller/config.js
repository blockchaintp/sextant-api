const forms = require('../forms')
const config = require('../config')
const packageJSON = require('../../package.json')

const ConfigBackend = () => {

  /*
  
    return any values required by the frontend api

    params:

    returns:

      object
        version (string)

  */
  const values = (params, done) => {
    done(null, {
      version: packageJSON.version,
      forms,
      userAccessLevels: config.PERMISSION_USER_ACCESS_LEVELS,
      roleAccessLevels: config.PERMISSION_ROLE_ACCESS_LEVELS,
    })
  }

  return {
    values,
  }

}

module.exports = ConfigBackend