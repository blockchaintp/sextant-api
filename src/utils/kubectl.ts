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

import { Cluster, Context, CoreV1Api, KubeConfig, PortForward, User } from '@kubernetes/client-node'
import { exec } from 'child-process-promise'
import { existsSync, unlinkSync } from 'fs'
import getPort from 'get-port'
import { createServer } from 'net'
import { tmpName } from 'tmp-promise'
import Logging from '../logging'
import { ProvisionType } from '../store/domain-types'
import { decode } from './base64'
import { writeYaml } from './yaml'

const logger = Logging.getLogger({
  name: 'utils/kubectl',
})

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

type KubectlConstructParams = {
  mode: ProvisionType
  remoteCredentials: {
    ca: string
    token: string
    apiServer: string
  }
}

type SetupDetails = { kubeConfigPath: string; connectionArguments: string[] }
type Options = any

const Kubectl = ({ mode, remoteCredentials }: KubectlConstructParams) => {
  if (!mode) throw new Error('mode required for Kubectl')
  if (MODES.indexOf(mode) < 0) throw new Error(`unknown mode for Kubectl: ${mode}`)

  if (mode === 'remote') {
    if (!remoteCredentials) throw new Error('remoteCredentials required for Kubectl remote mode')
    if (!remoteCredentials.ca) throw new Error('ca required for remote credentials')
    if (!remoteCredentials.token) throw new Error('token required for remote credentials')
    if (!remoteCredentials.apiServer) throw new Error('apiServer required for remote credentials')
  }

  const getRemoteCredentials = () => remoteCredentials

  /*

  write a YAML file

  */
  const writeTempYaml = async (data: any) => {
    const tmpPath = await tmpName({ postfix: '.yaml' })
    writeYaml(tmpPath, data)
    logger.debug({ message: `Wrote - ${tmpPath}` })
    return tmpPath
  }

  const createRemoteConfig = (): KubeConfig => {
    const cluster: Cluster = {
      name: 'target',
      server: remoteCredentials.apiServer,
      caData: remoteCredentials.ca,
      skipTLSVerify: true,
    }

    const user: User = {
      name: 'sextant',
      token: decode(remoteCredentials.token).toString(),
    }

    const context: Context = {
      cluster: cluster.name,
      user: user.name,
      name: 'target-context',
    }

    const kc = new KubeConfig()
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  const createLocalConfig = (): KubeConfig => {
    const cluster: Cluster = {
      name: 'target',
      server: LOCAL_API_SERVER,
      caFile: LOCAL_CA_PATH,
      skipTLSVerify: true,
    }

    const user: User = {
      name: 'sextant',
      keyFile: LOCAL_TOKEN_PATH,
    }

    const context: Context = {
      cluster: cluster.name,
      user: user.name,
      name: 'target-context',
    }

    const kc = new KubeConfig()
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  const getConfig = () => {
    if (mode === 'remote') {
      return createRemoteConfig()
    }
    if (mode === 'local') {
      return createLocalConfig()
    }
    const kc = new KubeConfig()
    kc.loadFromDefault()
    return kc
  }

  /*
    write the ca data to a tempfile so we can inject it into kubectl commands
  */
  // creates/writes kubeconfig to tmp file for remote modes and
  // returns connection arguments and kubeconfig path (setupDetails) to be used by following functions
  const localSetup = async (): Promise<SetupDetails> => {
    const kubeConfig = getConfig()
    const kubeConfigData = JSON.parse(kubeConfig.exportConfig())
    const kubeConfigPath = await writeTempYaml(kubeConfigData)
    const connectionArguments = ['--kubeconfig', kubeConfigPath]

    return { kubeConfigPath, connectionArguments }
  }

  // trashes the tmp file if there is a kubeconfigPath in the setupDetails
  const localTeardown = (setupDetails: SetupDetails) => {
    if (setupDetails.kubeConfigPath && existsSync(setupDetails.kubeConfigPath)) {
      unlinkSync(setupDetails.kubeConfigPath)
    }
  }

  const getOptions = (options: Options) => {
    const useOptions = {
      ...options,
      // allow 5MB back on stdout
      // (which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
    }
    useOptions.env = { ...process.env, ...options.env }
    return useOptions
  }

  const apiPortForward = ({
    namespace,
    pod,
    port,
    localPort = 0,
  }: {
    namespace: string
    pod: string
    port: number
    localPort: number
  }) => {
    const kubeConfig = getConfig()
    const forward = new PortForward(kubeConfig)
    const server = createServer((socket) => {
      forward.portForward(namespace, pod, [port], socket, null, socket)
    })
    const usePort = localPort === 0 ? port : localPort
    logger.debug(
      {
        namespace,
        pod,
        port,
        localPort,
      },
      'starting port-forward'
    )
    return server.listen(usePort, '127.0.0.1')
  }

  // pick a free local port and setup a port-forward to a pod
  // return an object that can close the forwarding process
  const portForward = async ({ namespace, pod, port }: { namespace: string; pod: string; port: number }) => {
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
      stop: () => {
        logger.debug(
          {
            namespace,
            pod,
            port,
            localPort,
          },
          'stopping port-forward'
        )
        server.close(() => {
          logger.debug(
            {
              namespace,
              pod,
              port,
              localPort,
            },
            'stopped port-forward'
          )
        })
      },
    }
  }

  const setupAndRunCommand = async (cmd: string, options: Options, commandType: string) => {
    const setupDetails = await localSetup()
    const useOptions = getOptions(options)
    let runCommand
    if (commandType === 'kubectl') {
      runCommand = `${commandType} ${cmd} ${setupDetails.connectionArguments.join(' ')}`
    } else {
      runCommand = `${commandType} ${setupDetails.connectionArguments.join(' ')} ${cmd}`
    }
    logger.debug({ action: commandType, command: `${cmd}` })
    const result = await exec(runCommand, useOptions)
      // remove the command itself from the error message so we don't leak credentials
      .catch((err) => {
        const errorParts: string[] = err.toString().split('\n')
        const okErrorParts = errorParts
          .filter((line) => (line.toLowerCase().indexOf('command failed:') >= 0 ? false : true))
          .filter((line) => line)
          .map((line) => line.replace(/error: /, ''))
        // eslint-disable-next-line no-param-reassign
        err.message = okErrorParts.join('\n')
        throw err
      })
    await localTeardown(setupDetails)
    logger.trace({ action: commandType, command: `${cmd}`, result: result.stdout })
    logger.debug({ action: commandType, message: 'command success' })
    return result.stdout.toString()
  }

  // run a kubectl command and return [ stdout, stderr ]
  const command = (cmd: string, options: Options = {}) => {
    const commandType = 'kubectl'
    return setupAndRunCommand(cmd, options, commandType)
  }

  // run a helm command and return [ stdout, stderr ]
  const helmCommand = (cmd: string, options: Options = {}) => {
    const commandType = 'helm'
    return setupAndRunCommand(cmd, options, commandType)
  }

  // run a kubectl command and process stdout as JSON
  const jsonCommand = async (cmd: string, options: Options = {}) => {
    const runCommand = `${cmd} --output json`
    logger.warn({ command: `${command}` }, 'jsonCommand is deprecated')
    const stdout = await command(runCommand, options)
    const processedOutput = JSON.parse(stdout)
    logger.debug({ message: 'kubectl command --output json success' })
    return processedOutput
  }

  const getClient = async (api = CoreV1Api) => {
    const kc = await getConfig()
    return kc.makeApiClient(api)
  }

  const getPods = async (namespace: string, options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNamespacedPod(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    logger.trace({
      numberOfPods: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getPods',
    })
    return body
  }

  const getNodes = async (options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNode(undefined, false, undefined, fieldSelector, labelSelector)
    logger.trace({
      numberOfNodes: body.items ? body.items.length : 0,
      labelSelector,
      fieldSelector,
      fn: 'getNodes',
    })
    return body
  }

  const getServices = async (namespace: string, options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNamespacedService(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    logger.trace({
      numberOfServices: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getServices',
    })
    return body
  }

  const getNamespaces = async (options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNamespace(undefined, false, undefined, fieldSelector, labelSelector)
    logger.trace({
      numberOfNamespaces: body.items ? body.items.length : 0,
      labelSelector,
      fieldSelector,
      fn: 'getNamespaces',
    })
    return body
  }

  const getSecrets = async (namespace: string, options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNamespacedSecret(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    logger.trace({
      numberOfSecrets: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getSecrets',
    })
    return body
  }

  const getSecretByName = async (namespace: string, name: string) => {
    const client = await getClient()
    const { body } = await client.readNamespacedSecret(name, namespace)
    return body
  }

  const getPersistentVolumeClaims = async (namespace: string, options: Options = {}) => {
    const { labelSelector, fieldSelector } = options
    const client = await getClient()
    const { body } = await client.listNamespacedPersistentVolumeClaim(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    logger.trace({
      numberOfPersistentVolumeClaims: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getPersistentVolumeClaims',
    })
    return body
  }

  const deletePod = async (namespace: string, name: string) => {
    const client = await getClient()
    const { body } = await client.deleteNamespacedPod(name, namespace)
    logger.info({
      body,
      namespace,
      name,
      fn: 'deletePod',
    })
    return body
  }

  const deleteConfigMap = async (namespace: string, name: string) => {
    const client = await getClient()
    const { body } = await client.deleteNamespacedConfigMap(name, namespace)
    logger.info({
      body,
      namespace,
      name,
      fn: 'deleteConfigMap',
    })
    return body
  }

  return {
    command,
    helmCommand,
    portForward,
    jsonCommand,
    getRemoteCredentials,
    getPods,
    getNodes,
    getServices,
    getNamespaces,
    getSecrets,
    getSecretByName,
    getPersistentVolumeClaims,
    deletePod,
    deleteConfigMap,
  }
}

export default Kubectl
