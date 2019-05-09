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

const base64 = require('./base64')

const pino = require('pino')({
  name: 'kubectl',
})

const exec = Promise.promisify(childProcess.exec, {
  multiArgs: true,
})

const tempFile = Promise.promisify(tmp.file)
const writeFile = Promise.promisify(fs.writeFile)
const readFile = Promise.promisify(fs.readFile)

const MODES = ['local', 'remote']

const LOCAL_TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token'
const LOCAL_CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'
const LOCAL_API_SERVER = 'https://kubernetes.default.svc'

/*

  mode is one of 'local' or 'remote'

  if 'remote' - then remoteCredentials are expected

  if 'local' - it will work out the credentials itself

  'remoteCredentials' object means we are connecting to a remote cluster

  this should have the following properties

   * apiServer
   * token
   * ca
  
  'localCredentials' object means we are running on the cluster we should connect to
  
  

*/
const Kubectl = ({
  mode,
  remoteCredentials,
} = {}) => {

  if(!mode) throw new Error(`mode required for Kubectl`)
  if(MODES.indexOf(mode) < 0) throw new Error(`unknown mode for Kubectl: ${mode}`)

  if(mode == 'remote') {
    if(!remoteCredentials) throw new Error(`remoteCredentials required for Kubectl remote mode`)
    if(!remoteCredentials.ca) throw new Error(`ca required for remote credentials`)
    if(!remoteCredentials.token) throw new Error(`token required for remote credentials`)
    if(!remoteCredentials.apiServer) throw new Error(`apiServer required for remote credentials`)
  }

  let isSetup = false

  // we inject these arguments to every kubectl call
  let connectionArguments = []

  /*
  
    write the ca data to a tempfile so we can inject it into kubectl commands
  
  */
  const setup = async () => {
    if(isSetup) return

    if(mode == 'remote') {

      const caPath = await tempFile({
        postfix: '.txt',
      })
  
      await writeFile(caPath, remoteCredentials.ca, 'base64')

      connectionArguments = [
        '--certificate-authority',
        caPath,
        '--token',
        base64.decode(remoteCredentials.token),
        '--server',
        remoteCredentials.apiServer,
      ]
    }
    else if(mode == 'local') {

      const token = await readFile(LOCAL_TOKEN_PATH, 'utf8')

      connectionArguments = [
        '--certificate-authority',
        LOCAL_CA_PATH,
        '--token',
        token,
        '--server',
        LOCAL_API_SERVER,
      ]
    }

    isSetup = true
  }

  // run a kubectl command and return [ stdout, stderr ]
  const command = async (cmd, options = {}) => {
    await setup()
    const useOptions = Object.assign({}, options, {
      // allow 5MB back on stdout 
      //(which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
    })
    useOptions.env = Object.assign({}, process.env, options.env)
    const runCommand = `kubectl ${connectionArguments.join(' ')} ${cmd}`
    return exec(runCommand, useOptions)
      // remove the command itself from the error message so we don't leak credentials
      .catch(err => {
        const errorParts = err.toString().split("\n")
        const okErrorParts = errorParts
          .filter(line => line.toLowerCase().indexOf('command failed:') >= 0 ? false : true)
          .filter(line => line)
          .map(line => line.replace(/error: /, ''))
        err.message = okErrorParts.join("\n")
        throw err
      })
  }

  // process stdout as JSON
  const jsonCommand = async (cmd, options = {}) => {
    const runCommand = `${ cmd } --output json`
    const [ stdout, stderr ] = await command(runCommand, options)
    const processedOutput = JSON.parse(stdout)
    return [ processedOutput, stderr ]
  }

  // apply a filename
  const apply = (filepath) => command(`apply -f ${ filepath }`)

  // given some YAML content - write a tempfile then apply it
  const applyInline = async (data) => {
    const filepath = await tempFile({
      postfix: '.yaml',
    })
    await writeFile(filepath, data, 'utf8')
    return apply(filepath)
  }

  // delete a filename
  const del = (filepath) => command(`delete -f ${ filepath }`)

  // given some YAML content - write a tempfile then delete it
  const deleteInline = async (data) => {
    const filepath = await tempFile({
      postfix: '.yaml',
    })
    await writeFile(filepath, data, 'utf8')
    return del(filepath)
  }

  return {
    command,
    jsonCommand,
    apply,
    applyInline,
    delete: del,
    deleteInline,
  }
}

module.exports = Kubectl