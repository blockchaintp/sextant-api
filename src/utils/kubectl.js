/*

  factory function that returns a kubectl library that is bound to a cluster

  it overrides the 'command' function injecting the KUBECONFIG environment
  variable to any call which connects the kubectl command to the given cluster
  
*/
const fs = require('fs')
const exec = require('child_process').exec
const pino = require('pino')({
  name: 'kubectl',
})

const Kubectl = (kubeconfigPath) => {
  const command = (cmd, options, done) => {

    if(!done) {
      done = options
      options = {}
    }

    const useOptions = Object.assign({}, options, {
      // allow 5MB back on stdout 
      //(which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
    })

    useOptions.env = Object.assign({}, process.env, options.env)
    useOptions.env.KUBECONFIG = kubeconfigPath

    const runCommand = `kubectl ${cmd}`

    pino.info({
      action: 'command',
      command: runCommand,
      options: useOptions,
    })

    exec(runCommand, useOptions, (err, stdout, stderr) => {
      if(err) return done(err)
      done(null, stdout.toString(), stderr.toString())
    })
  }

  /*

    run a kubectl command that assumes JSON output
    add `--output json` and process stdout

    params:

     * command
    
  */
  const jsonCommand = (params, done) => {
    if(!params.command) return done(`command param required for kubectl.jsonCommand`)
    const runCommand = `${ command } --output json`

    command(runCommand, (err, stdout) => {
      if(err) return done(err)
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

  return {
    command,
    jsonCommand,
    apply,
  }
}

module.exports = Kubectl