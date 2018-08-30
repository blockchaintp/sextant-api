const awsRegions = require('aws-regions')
const packageJSON = require('../../package.json')
const pino = require('pino')({
  name: 'backend.config',
})

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
      awsRegions: awsRegions.list({ public: true }),
    })
  }

  return {
    version,
    values,
  }

}

module.exports = ConfigBackend