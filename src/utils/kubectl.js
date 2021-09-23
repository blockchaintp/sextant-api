/* eslint-disable no-unneeded-ternary */
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
const split = require('split')
const getPort = require('get-port')
const fs = require('fs')
const childProcess = require('child_process')
const yaml = require('js-yaml')

const logger = require('../logging').getLogger({
  name: 'utils/kubectl',
})

const base64 = require('./base64')

const exec = Promise.promisify(childProcess.exec)

const tempName = Promise.promisify(tmp.tmpName)
const writeFile = Promise.promisify(fs.writeFile)
const readFile = Promise.promisify(fs.readFile)

const MODES = ['local', 'remote', 'test']

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
  if (!mode) throw new Error('mode required for Kubectl')
  if (MODES.indexOf(mode) < 0) throw new Error(`unknown mode for Kubectl: ${mode}`)

  if (mode === 'remote') {
    if (!remoteCredentials) throw new Error('remoteCredentials required for Kubectl remote mode')
    if (!remoteCredentials.ca) throw new Error('ca required for remote credentials')
    if (!remoteCredentials.token) throw new Error('token required for remote credentials')
    if (!remoteCredentials.apiServer) throw new Error('apiServer required for remote credentials')
  }

  /*

  write a YAML file

  */
  const writeTempYaml = async (data) => {
    const yamlText = yaml.safeDump(data)
    const tmpPath = await tempName({ postfix: '.yaml' })
    await writeFile(tmpPath, yamlText, 'utf8')
    logger.debug({ message: `Wrote - ${tmpPath}` })
    return tmpPath
  }

  /*

    write the ca data to a tempfile so we can inject it into kubectl commands

  */

  // creates/writes kubeconfig to tmp file for remote modes and
  // returns connection arguments and kubeconfig path (setupDetails) to be used by following functions
  const localSetup = async () => {
    if (mode === 'remote') {
      const kubeconfigData = {
        kind: 'Config',
        preferences: {},
        users: [
          {
            name: 'sextant',
            user: {
              token: base64.decode(remoteCredentials.token).toString(),
            },
          },
        ],
        contexts: [
          {
            context: {
              cluster: 'target',
              user: 'sextant',
            },
            name: 'target-context',
          },
        ],
        'current-context': 'target-context',
        clusters: [
          {
            cluster: {
              'certificate-authority-data': remoteCredentials.ca,
              server: remoteCredentials.apiServer,
            },
            name: 'target',

          },
        ],
      }
      const kubeConfigPath = await writeTempYaml(kubeconfigData)

      const connectionArguments = [
        '--kubeconfig', kubeConfigPath,
      ]

      return {
        kubeConfigPath,
        connectionArguments,
      }
    }
    if (mode === 'local') {
      const token = await readFile(LOCAL_TOKEN_PATH, 'utf8')

      const connectionArguments = [
        '--certificate-authority',
        LOCAL_CA_PATH,
        '--token',
        token,
        '--server',
        LOCAL_API_SERVER,
      ]

      return { connectionArguments }
    }
    if (mode === 'test') {
      return {
        kubeConfigPath: '/dev/null',
        connectionArguments: [],
      }
    }
    throw new Error('mode required for Kubectl')
  }

  // trashes the tmp file if there is a kubeconfigPath in the setupDetails
  const localTeardown = async (setupDetails) => {
    if (setupDetails.kubeConfigPath && fs.existsSync(setupDetails.kubeConfigPath)) {
      fs.unlinkSync(setupDetails.kubeConfigPath)
    }
  }

  const getOptions = (options) => {
    const useOptions = {
      ...options,
      // allow 5MB back on stdout
      // (which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
    }
    useOptions.env = { ...process.env, ...options.env }
    return useOptions
  }

  // pick a free local port and setup a port-forward to a pod
  // return an object that can close the forwarding process
  const portForward = async ({
    namespace,
    pod,
    port,
  }) => {
    if (!pod) throw new Error('A running pod is required for port forwarding')
    const setupDetails = await localSetup()
    const useOptions = getOptions({})
    const localPort = await getPort()

    const args = setupDetails.connectionArguments.concat([
      '-n', namespace,
      'port-forward',
      `pod/${pod}`,
      `${localPort}:${port}`,
    ])

    const forwardingProcess = await new Promise((resolve, reject) => {
      let complete = false
      let stderr = ''

      const spawnedProcess = childProcess.spawn('kubectl', args, {
        env: useOptions.env,
        stdio: 'pipe',
      })

      // watch for confirmation the proxy is setup
      spawnedProcess.stdout
        .pipe(split())
        .on('data', (line) => {
          // this is the key line kubectl port-forward prints once the proxy is setup
          if (line === `Forwarding from 127.0.0.1:${localPort} -> ${port}`) { complete = true }
          resolve(spawnedProcess)
        })

      // capture stderr so we can throw an error if there is one
      spawnedProcess.stderr
        .pipe(split())
        .on('data', (line) => {
          stderr += `${line}\n`
        })

      spawnedProcess.on('exit', (code) => {
        if (code > 0 && !complete) {
          complete = true
          reject(new Error(stderr))
        }
      })
    })

    await localTeardown(setupDetails)
    return {
      port: localPort,
      stop: async () => {
        forwardingProcess.kill()
      },
    }
  }
  const setupAndRunCommand = async (cmd, options, commandType) => {
    const setupDetails = await localSetup()
    const useOptions = getOptions(options)
    const runCommand = `${commandType} ${setupDetails.connectionArguments.join(' ')} ${cmd}`
    logger.debug({ action: 'running a standard kubectl command', command: `${cmd}` })
    const result = await exec(runCommand, useOptions)
      // remove the command itself from the error message so we don't leak credentials
      .catch((err) => {
        const errorParts = err.toString().split('\n')
        const okErrorParts = errorParts
          .filter((line) => (line.toLowerCase().indexOf('command failed:') >= 0 ? false : true))
          .filter((line) => line)
          .map((line) => line.replace(/error: /, ''))
        err.message = okErrorParts.join('\n')
        throw err
      })
    await localTeardown(setupDetails)
    logger.debug({ message: `${commandType} command sucess` })
    return result
  }

  // run a kubectl command and return [ stdout, stderr ]
  const command = async (cmd, options = {}) => {
    const commandType = 'kubectl'
    return setupAndRunCommand(cmd, options, commandType)
  }

  // run a helm command and return [ stdout, stderr ]
  // helmCommand("-n someNamespace install <someName>-<theChartfile> -f <theChartFile>.tgz")
  // helmCommand("-n someNamespace uninstall <someName>-<theChartfile>")
  const helmCommand = async (cmd, options = {}) => {
    const commandType = 'helm'
    return setupAndRunCommand(cmd, options, commandType)
  }

  // run a kubectl command and process stdout as JSON
  const jsonCommand = async (cmd, options = {}) => {
    const runCommand = `${cmd} --output json`
    logger.debug({ action: 'running a kubectl command with json output', command: `${command}` })
    const stdout = await command(runCommand, options)
    const processedOutput = JSON.parse(stdout)
    logger.debug({ message: 'kubectl command --output json sucess' })
    return processedOutput
  }

  // apply a filename
  const apply = (filepath) => command(`apply -f ${filepath}`)

  // given some YAML content - write a tempfile then apply it
  const applyInline = async (data) => {
    const filepath = await tempName({
      postfix: '.yaml',
    })
    await writeFile(filepath, data, 'utf8')
    return apply(filepath)
  }

  // delete the resources defined in filepath
  const del = (filepath) => command(`delete -f ${filepath}`)

  // given some YAML content - write a tempfile then delete the resources defined in it
  const deleteInline = async (data) => {
    const filepath = await tempName({
      postfix: '.yaml',
    })
    await writeFile(filepath, data, 'utf8')
    return del(filepath)
  }

  return {
    command,
    helmCommand,
    portForward,
    jsonCommand,
    apply,
    applyInline,
    delete: del,
    deleteInline,
    remoteCredentials,
  }
}

module.exports = Kubectl
