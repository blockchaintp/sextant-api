/*

  factory function that returns a kubectl library that is bound to a cluster

  it overrides the 'command' function injecting the KUBECONFIG environment
  variable to any call which connects the kubectl command to the given cluster

  if the `kubeConfigPath` variable is given - we connect using that

  otherwise - we connect using the credentials which are a combination of

   * apiServer
   * token
   * ca
  
  

*/

const Promise = require('bluebird')
const tmp = require('tmp')
const async = require('async')
const fs = require('fs')
const childProcess = require('child_process')

const pino = require('pino')({
  name: 'kubectl',
})

const exec = Promise.promisify(childProcess.exec, {
  multiArgs: true,
})

const tempFile = Promise.promisify(tmp.file)
const writeFile = Promise.promisify(fs.writeFile)

/*

  passing in a 'remoteCredentials' object means we are connecting to a remote cluster

  this should have the following properties

   * apiServer
   * token
   * ca

*/
const Kubectl = ({
  remoteCredentials,
} = {}) => {

  let isSetup = false
  let caPath = null

  /*
  
    write the ca data to a tempfile so we can inject it into kubectl commands
  
  */
  const setup = async () => {
    if(isSetup) return

    if(remoteCredentials) {
      caPath = await tempFile({
        postfix: '.txt',
      })
  
      await writeFile(caPath, ca, 'utf8')
    }

    isSetup = true
  }

  const command = async (cmd, options = {}) => {
    const useOptions = Object.assign({}, options, {
      // allow 5MB back on stdout 
      //(which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
    })

    useOptions.env = Object.assign({}, process.env, options.env)

    const runCommand = `kubectl ${cmd}`

    return exec(runCommand, useOptions)
  }

  /*

    run a kubectl command that assumes JSON output
    add `--output json` and process stdout

    params:

     * command
     * allowFail
    
  */
  const jsonCommand = (params, done) => {
    if(!params.command) return done(`command param required for kubectl.jsonCommand`)
    const runCommand = `${ params.command } --output json`

    command(runCommand, (err, stdout) => {
      if(err) {
        if(params.allowFail) {
          return done()
        }
        else {
          return done(err)  
        }
      }
      let processedResult = null
      try {
        processedResult = JSON.parse(stdout)
      } catch(e) {
        return done(e.toString())
      }
      done(null, processedResult)
    })
  }

  /*

    apply a manifest that is a filepath or url

    params:

     * resource - a filepath or url of a manifest
    
  */
  const apply = (params, done) => {
    if(!params.resource) return done(`resource param required for kubectl.apply`)
    command(`apply -f ${ params.resource }`, done)
  }

  /*

    apply a manifest that is given as is

    write to a temp file before using normal apply

    params:

     * data - yaml manifest data
    
  */
  const applyInline = (params, done) => {
    if(!params.data) return done(`data param required for kubectl.applyInline`)
    async.waterfall([

      (next) => {
        tmp.file({
          postfix: '.yaml',
        }, (err, filepath) => {
          if(err) return next(err)
          next(null, filepath)
        })
      },

      (filepath, next) => {
        fs.writeFile(filepath, params.data, 'utf8', (err) => {
          if(err) return next(err)
          next(null, filepath)
        })
      },

      (filepath, next) => {
        apply({
          resource: filepath
        }, next)
      },

    ], done)
  }


  /*

    delete a manifest that is a filepath or url

    params:

     * resource - a filepath or url of a manifest
    
  */
  const del = (params, done) => {
    if(!params.resource) return done(`resource param required for kubectl.del`)
    command(`delete -f ${ params.resource }`, done)
  }

  /*

    delete a manifest that is given as is

    write to a temp file before using normal delete

    params:

     * data - yaml manifest data
     * allowFail
    
  */
  const delInline = (params, done) => {
    if(!params.data) return done(`data param required for kubectl.delInline`)
    async.waterfall([

      (next) => {
        tmp.file({
          postfix: '.yaml',
        }, (err, filepath) => {
          if(err) return next(err)
          next(null, filepath)
        })
      },

      (filepath, next) => {
        fs.writeFile(filepath, params.data, 'utf8', (err) => {
          if(err) return next(err)
          next(null, filepath)
        })
      },

      (filepath, next) => {
        del({
          resource: filepath
        }, (err, result) => {
          if(err) {
            if(params.allowFail) {
              return next()
            }
            else {
              return next(err)
            }
          }
          next(null, result)
        })
      },

    ], done)
  }

  return {
    command,
    jsonCommand,
    apply,
    applyInline,
    del,
    delInline,
  }
}

module.exports = Kubectl