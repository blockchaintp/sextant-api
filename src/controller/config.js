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
    })
  }

  return {
    values,
  }

}

module.exports = ConfigBackend