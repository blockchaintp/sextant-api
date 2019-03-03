const packageJSON = require('../../package.json')

const ConfigBackend = () => {
  
  /*
  
    return the current version as defined in package.json

    params:

    returns:

      version (string)

  */
  const version = (params, done) => {
    done(null, packageJSON.version)
  }

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
    })
  }

  return {
    version,
    values,
  }

}

module.exports = ConfigBackend