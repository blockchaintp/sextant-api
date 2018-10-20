const async = require('async')
const packageJSON = require('../../package.json')
const instanceJSON = require('../data/aws-instances-minimal.json')
const AWS = require('../utils/aws')
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
    })
  }

  /*
  
    get the backend aws values needed for a cluster config
    
  */
  const aws = (params, done) => {
    async.parallel({
      route53Domains: next => AWS.listRoute53Domains(next),
    }, (err, results) => {
      if(err) return done(err)

      done(null, {
        regions: AWS.regions(),
        instances: instanceJSON,
        domains: results.route53Domains,
      })
    })
  }

  return {
    version,
    values,
    aws,
  }

}

module.exports = ConfigBackend