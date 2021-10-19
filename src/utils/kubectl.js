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
const getPort = require('get-port')
const fs = require('fs')
const k8s = require('@kubernetes/client-node');
const childProcess = require('child_process')
const yaml = require('js-yaml')
const net = require('net')

const logger = require('../logging').getLogger({
  name: 'utils/kubectl',
})

const base64 = require('./base64')

const exec = Promise.promisify(childProcess.exec)

const tempName = Promise.promisify(tmp.tmpName)
const writeFile = Promise.promisify(fs.writeFile)

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

  const createRemoteConfig = async () => {
    const cluster = {
      name: 'target',
      server: remoteCredentials.apiServer,
      caData: remoteCredentials.ca,
    }

    const user = {
      name: 'sextant',
      token: base64.decode(remoteCredentials.token).toString(),
    }

    const context = {
      cluster: cluster.name,
      user: user.name,
      name: 'target-context',
    }

    const kc = new k8s.KubeConfig();
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  const createLocalConfig = async () => {
    const cluster = {
      name: 'target',
      server: LOCAL_API_SERVER,
      caFile: LOCAL_CA_PATH,
    }

    const user = {
      name: 'sextant',
      keyFile: LOCAL_TOKEN_PATH,
    }

    const context = {
      cluster: cluster.name,
      user: user.name,
      name: 'target-context',
    }

    const kc = new k8s.KubeConfig();
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  const getConfig = async () => {
    if (mode === 'remote') {
      return createRemoteConfig()
    }
    if (mode === 'local') {
      return createLocalConfig()
    }
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault()
    return kc
  }

  /*
    write the ca data to a tempfile so we can inject it into kubectl commands
  */
  // creates/writes kubeconfig to tmp file for remote modes and
  // returns connection arguments and kubeconfig path (setupDetails) to be used by following functions
  const localSetup = async () => {
    const kubeConfig = await getConfig();
    const kubeConfigData = JSON.parse(kubeConfig.exportConfig())
    const kubeConfigPath = await writeTempYaml(kubeConfigData)
    const connectionArguments = [
      '--kubeconfig', kubeConfigPath,
    ]

    return { kubeConfigPath, connectionArguments }
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

  const apiPortForward = async ({
    namespace,
    pod,
    port,
    localPort = 0,
  }) => {
    const kubeConfig = await getConfig()
    const forward = new k8s.PortForward(kubeConfig)
    const server = net.createServer((socket) => {
      forward.portForward(namespace, pod, [port], socket, null, socket);
    })
    const usePort = localPort === 0 ? port : localPort
    logger.debug({
      namespace, pod, port, localPort,
    }, 'starting port-forward')
    return server.listen(usePort, '127.0.0.1')
  }

  // pick a free local port and setup a port-forward to a pod
  // return an object that can close the forwarding process
  const portForward = async ({
    namespace,
    pod,
    port,
  }) => {
    if (!pod) throw new Error('A running pod is required for port forwarding')
    const localPort = await getPort()

    const server = await apiPortForward({
      namespace,
      pod,
      port,
      localPort,
    })

    return {
      port: localPort,
      stop: async () => {
        logger.debug({
          namespace, pod, port, localPort,
        }, 'stopping port-forward')
        server.close(() => {
          logger.debug({
            namespace, pod, port, localPort,
          }, 'stopped port-forward')
        })
      },
    }
  }

  const setupAndRunCommand = async (cmd, options, commandType) => {
    const setupDetails = await localSetup()
    const useOptions = getOptions(options)
    let runCommand;
    if (commandType === 'kubectl') {
      runCommand = `${commandType} ${cmd} ${setupDetails.connectionArguments.join(' ')}`
    } else {
      runCommand = `${commandType} ${setupDetails.connectionArguments.join(' ')} ${cmd}`
    }
    logger.debug({ action: commandType, command: `${cmd}` })
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
    logger.trace({ action: commandType, command: `${cmd}`, result })
    logger.debug({ action: commandType, message: 'command success' })
    return result
  }

  // run a kubectl command and return [ stdout, stderr ]
  const command = async (cmd, options = {}) => {
    const commandType = 'kubectl'
    return setupAndRunCommand(cmd, options, commandType)
  }

  // run a helm command and return [ stdout, stderr ]
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
    logger.debug({ message: 'kubectl command --output json success' })
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

  const getPods = async (namespace, options = {}) => {
    const {
      labelSelector,
      fieldSelector,
    } = options
    const kc = await getConfig()
    const client = kc.makeApiClient(k8s.CoreV1Api)
    const { body } = await client.listNamespacedPod(
      namespace, undefined, false, undefined, fieldSelector, labelSelector,
    )
    return body
  }

  const getNodes = async (options = {}) => {
    const {
      labelSelector,
      fieldSelector,
    } = options
    const kc = await getConfig()
    const client = kc.makeApiClient(k8s.CoreV1Api)
    const { body } = await client.listNode(undefined, false, undefined, fieldSelector, labelSelector)
    return body
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
    getPods,
    getNodes,
  }
}

module.exports = Kubectl
