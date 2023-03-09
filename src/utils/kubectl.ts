/* eslint-disable @typescript-eslint/member-ordering */
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

import * as k8s from '@kubernetes/client-node'
import * as childProcess from 'child_process'
import { existsSync, unlinkSync, writeFileSync } from 'fs'
import * as getPort from 'get-port'
import * as yaml from 'js-yaml'
import * as net from 'net'
import { TmpNameOptions, tmpNameSync } from 'tmp'
import * as util from 'util'
import { getLogger } from '../logging'
import * as base64 from './base64'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/kubectl',
})

const exec = util.promisify(childProcess.exec)

const MODES = ['local', 'remote', 'test']

const LOCAL_TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token'
const LOCAL_CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'
const LOCAL_API_SERVER = 'https://kubernetes.default.svc'

type K8Selector = { labelSelector?: string; fieldSelector?: string }
type PodPort = { namespace: string; pod: string; port: number }
type PortForwardSpec = PodPort & { localPort: number }

export type RemoteCredentials = {
  apiServer?: string
  ca?: string
  token?: string
}
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
export class Kubectl {
  private remoteCredentials: RemoteCredentials
  private mode: string

  constructor({ mode, remoteCredentials }: { mode: string; remoteCredentials?: RemoteCredentials }) {
    if (!mode) throw new Error('mode required for Kubectl')
    if (MODES.indexOf(mode) < 0) throw new Error(`unknown mode for Kubectl: ${mode}`)

    if (mode === 'remote') {
      if (!remoteCredentials) throw new Error('remoteCredentials required for Kubectl remote mode')
      if (!remoteCredentials.ca) throw new Error('ca required for remote credentials')
      if (!remoteCredentials.token) throw new Error('token required for remote credentials')
      if (!remoteCredentials.apiServer) throw new Error('apiServer required for remote credentials')
    }
    this.remoteCredentials = remoteCredentials
    this.mode = mode
  }

  public getRemoteCredentials() {
    return this.remoteCredentials
  }

  /*
  write a YAML file
  */
  private writeTempYaml(data): string {
    const yamlText = yaml.dump(data, { schema: yaml.FAILSAFE_SCHEMA })
    const options: TmpNameOptions = { postfix: '.yaml' }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const tmpPath = tmpNameSync(options)

    writeFileSync(tmpPath, yamlText, 'utf8')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ message: `Wrote - ${tmpPath}` })
    return tmpPath
  }

  private createRemoteConfig() {
    const cluster: k8s.Cluster = {
      name: 'target',
      server: this.remoteCredentials.apiServer,
      caData: this.remoteCredentials.ca,
      skipTLSVerify: true,
    }

    const user: k8s.User = {
      name: 'sextant',
      token: base64.decode(this.remoteCredentials.token).toString(),
    }

    const context: k8s.Context = {
      cluster: cluster.name,
      user: user.name,
      name: 'target-context',
    }

    const kc = new k8s.KubeConfig()
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  private createLocalConfig() {
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

    const kc = new k8s.KubeConfig()
    kc.loadFromOptions({
      clusters: [cluster],
      users: [user],
      contexts: [context],
      currentContext: context.name,
    })
    return kc
  }

  private getConfig() {
    if (this.mode === 'remote') {
      return this.createRemoteConfig()
    }
    if (this.mode === 'local') {
      return this.createLocalConfig()
    }
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    return kc
  }

  /*
    write the ca data to a tempfile so we can inject it into kubectl commands
  */
  // creates/writes kubeconfig to tmp file for remote modes and
  // returns connection arguments and kubeconfig path (setupDetails) to be used by following functions
  private localSetup() {
    const kubeConfig = this.getConfig()
    const kubeConfigData: unknown = JSON.parse(kubeConfig.exportConfig())
    const kubeConfigPath = this.writeTempYaml(kubeConfigData)
    const connectionArguments = ['--kubeconfig', kubeConfigPath]

    return { kubeConfigPath, connectionArguments }
  }

  // trashes the tmp file if there is a kubeconfigPath in the setupDetails
  private localTeardown(setupDetails: { kubeConfigPath?: string }) {
    if (setupDetails.kubeConfigPath && existsSync(setupDetails.kubeConfigPath)) {
      unlinkSync(setupDetails.kubeConfigPath)
    }
  }

  private getOptions(options: { env?: { [key: string]: string }; [key: string]: unknown }) {
    const useOptions: object = {
      ...options,
      // allow 5MB back on stdout
      // (which should not happen but some logs might be longer than 200kb which is the default)
      maxBuffer: 1024 * 1024 * 5,
      env: {
        ...process.env,
        ...options.env,
      },
    }
    return useOptions
  }

  private apiPortForward({ namespace, pod, port, localPort = 0 }: PortForwardSpec): net.Server {
    const kubeConfig = this.getConfig()
    const forward = new k8s.PortForward(kubeConfig)
    const server = net.createServer((socket) => {
      void forward.portForward(namespace, pod, [port], socket, null, socket)
    })
    const usePort = localPort === 0 ? port : localPort
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
  public async portForward({ namespace, pod, port }: PodPort) {
    if (!pod) throw new Error('A running pod is required for port forwarding')
    const localPort = await getPort()

    const server = this.apiPortForward({
      namespace,
      pod,
      port,
      localPort,
    })

    return {
      port: localPort,
      stop: () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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

  private async setupAndRunCommand(
    cmd: string,
    options: {
      [key in string]: unknown
    },
    commandType: string
  ) {
    const setupDetails = this.localSetup()
    const useOptions = this.getOptions(options)
    let runCommand: string
    if (commandType === 'kubectl') {
      runCommand = `${commandType} ${cmd} ${setupDetails.connectionArguments.join(' ')}`
    } else {
      runCommand = `${commandType} ${setupDetails.connectionArguments.join(' ')} ${cmd}`
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ action: commandType, command: `${cmd}` })
    let result: {
      stdout: string
      stderr: string
    }
    try {
      result = await exec(runCommand, useOptions)
    } catch (err) {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const errorParts: string[] = err.toString().split('\n')
      const okErrorParts = errorParts
        .filter((line) => (line.toLowerCase().indexOf('command failed:') >= 0 ? false : true))
        .filter((line) => line)
        .map((line) => line.replace(/error: /, ''))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      err.message = okErrorParts.join('\n')
      throw err
    }
    this.localTeardown(setupDetails)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({ action: commandType, command: `${cmd}`, result })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ action: commandType, message: 'command success' })
    return result
  }

  // run a kubectl command and return [ stdout, stderr ]
  public command(
    cmd: string,
    options: {
      [key in string]: unknown
    } = {}
  ) {
    const commandType = 'kubectl'
    return this.setupAndRunCommand(cmd, options, commandType)
  }

  // run a helm command and return [ stdout, stderr ]
  public helmCommand(
    cmd: string,
    options: {
      [key in string]: unknown
    } = {}
  ) {
    const commandType = 'helm'
    return this.setupAndRunCommand(cmd, options, commandType)
  }

  // run a kubectl command and process stdout as JSON
  public async jsonCommand(
    cmd: string,
    options: {
      [key in string]: unknown
    } = {}
  ) {
    const runCommand = `${cmd} --output json`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.warn({ command: `${runCommand}` }, 'jsonCommand is deprecated')
    const { stdout } = await this.command(runCommand, options)
    const processedOutput: unknown = JSON.parse(stdout)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ message: 'kubectl command --output json success' })
    return processedOutput
  }

  private getClient(api = k8s.CoreV1Api) {
    const kc = this.getConfig()
    return kc.makeApiClient(api)
  }

  public async getPods(namespace: string, options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNamespacedPod(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfPods: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getPods',
    })
    return body
  }

  public async getNodes(options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNode(undefined, false, undefined, fieldSelector, labelSelector)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfNodes: body.items ? body.items.length : 0,
      labelSelector,
      fieldSelector,
      fn: 'getNodes',
    })
    return body
  }

  public async getServices(namespace: string, options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNamespacedService(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfServices: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getServices',
    })
    return body
  }

  public async getNamespaces(options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNamespace(undefined, false, undefined, fieldSelector, labelSelector)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfNamespaces: body.items ? body.items.length : 0,
      labelSelector,
      fieldSelector,
      fn: 'getNamespaces',
    })
    return body
  }

  public async getSecrets(namespace: string, options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNamespacedSecret(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfSecrets: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getSecrets',
    })
    return body
  }

  public async getSecretByName(namespace: string, name: string) {
    const client = this.getClient()
    const { body } = await client.readNamespacedSecret(name, namespace)
    return body
  }

  public async getPersistentVolumeClaims(namespace: string, options: K8Selector = {}) {
    const { labelSelector, fieldSelector } = options
    const client = this.getClient()
    const { body } = await client.listNamespacedPersistentVolumeClaim(
      namespace,
      undefined,
      false,
      undefined,
      fieldSelector,
      labelSelector
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({
      numberOfPersistentVolumeClaims: body.items ? body.items.length : 0,
      namespace,
      labelSelector,
      fieldSelector,
      fn: 'getPersistentVolumeClaims',
    })
    return body
  }

  public async deletePod(namespace: string, name: string) {
    const client = this.getClient()
    const { body } = await client.deleteNamespacedPod(name, namespace)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      body,
      namespace,
      name,
      fn: 'deletePod',
    })
    return body
  }

  public async deleteConfigMap(namespace: string, name: string) {
    const client = this.getClient()
    const { body } = await client.deleteNamespacedConfigMap(name, namespace)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      body,
      namespace,
      name,
      fn: 'deleteConfigMap',
    })
    return body
  }
}