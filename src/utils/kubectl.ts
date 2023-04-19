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
import { existsSync, unlinkSync } from 'fs'
import * as net from 'net'
import { TmpNameOptions, tmpNameSync } from 'tmp'
import * as util from 'util'
import { K8S_CREDENTIALS_SECRET_NAME } from '../constants'
import { getLogger } from '../logging'
import { Store } from '../store'
import { Cluster } from '../store/model/model-types'
import * as base64 from './base64'
import { writeYaml } from './yaml'
import getPort = require('get-port')

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/kubectl',
})

const exec = util.promisify(childProcess.exec)

const LOCAL_TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token'
const LOCAL_CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'
const LOCAL_API_SERVER = 'https://kubernetes.default.svc'

type K8Selector = { fieldSelector?: string; labelSelector?: string }
type PodPort = { namespace: string; pod: string; port: number }
type PortForwardSpec = PodPort & { localPort: number }

type TypedCredentials = {
  mode: 'local' | 'remote' | 'test' | 'user'
}

type OldServiceCredentials = TypedCredentials & {
  apiServer?: string
  ca?: string
  mode: 'remote'
  token?: string
}

type TestCredentials = TypedCredentials & {
  mode: 'test'
}

type LocalCredentials = TypedCredentials & {
  mode: 'local'
}

type UserCredentials = TypedCredentials & {
  cluster: k8s.Cluster
  mode: 'user'
  user: k8s.User
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

type KubectlCredentials = OldServiceCredentials | TestCredentials | LocalCredentials | UserCredentials

export class Kubectl {
  private credentials: KubectlCredentials

  constructor(credentials: KubectlCredentials) {
    this.credentials = credentials
  }

  public static async getKubectlForCluster({ cluster, store }: { cluster: Cluster; store: Store }) {
    const k8sCredentials = await store.clustersecret.get({
      cluster: cluster.id,
      name: K8S_CREDENTIALS_SECRET_NAME,
    })
    if (k8sCredentials) {
      const partialCreds = JSON.parse(base64.decode(k8sCredentials.base64data).toString()) as {
        cluster: k8s.Cluster
        user: k8s.User
      }

      const credentials = {
        mode: 'user',
        cluster: partialCreds.cluster,
        user: partialCreds.user,
      } as UserCredentials

      return new Kubectl(credentials)
    }

    const tokenSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.token_id as number,
    })

    const caSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.ca_id as number,
    })

    if (!tokenSecret || !caSecret) {
      throw new Error('Missing token or ca secret')
    }

    const credentials = {
      mode: 'remote',
      token: tokenSecret.base64data,
      ca: caSecret.base64data,
      apiServer: cluster.desired_state.apiServer as string,
    } as OldServiceCredentials

    return new Kubectl(credentials)
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

  public async getSecretByName(namespace: string, name: string) {
    const client = this.getClient()
    const { body } = await client.readNamespacedSecret(name, namespace)
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

  private apiPortForward({ namespace, pod, port, localPort = 0 }: PortForwardSpec): net.Server {
    const kubeConfig = this.getConfig()
    const forward = new k8s.PortForward(kubeConfig)
    const server = net.createServer((socket) => {
      forward.portForward(namespace, pod, [port], socket, null, socket).catch((err: unknown) => {
        logger.warn({ namespace, pod, port, err }, 'port-forward error')
      })
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

  private createRemoteConfig(credentials: OldServiceCredentials) {
    if (!credentials.apiServer || !credentials.token || !credentials.ca) {
      throw new Error('apiServer, token and ca are all required fields for credentials')
    }
    const cluster: k8s.Cluster = {
      name: 'target',
      server: credentials.apiServer,
      caData: credentials.ca,
      skipTLSVerify: credentials.ca ? false : true,
    }

    const user: k8s.User = {
      name: 'sextant',
      token: base64.decode(credentials.token).toString(),
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

  private createUserConfig(credentials: UserCredentials) {
    const cluster = credentials.cluster
    const user = credentials.user
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

  private getClient(api = k8s.CoreV1Api) {
    const kc = this.getConfig()
    return kc.makeApiClient(api)
  }

  private getConfig() {
    switch (this.credentials.mode) {
      case 'remote':
        return this.createRemoteConfig(this.credentials)
      case 'local':
        return this.createLocalConfig()
      case 'user':
        return this.createUserConfig(this.credentials)
      case 'test':
      default:
    }
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    return kc
  }

  private getOptions(options: { [key: string]: unknown; env?: { [key: string]: string } }) {
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
  /*
    write the ca data to a tempfile so we can inject it into kubectl commands
  */
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

  private async setupAndRunCommand(
    cmd: string,
    options: {
      [key in string]: unknown
    },
    commandType: 'helm' | 'kubectl'
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
      stderr: string
      stdout: string
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

  /*
  write a YAML file
  */
  private writeTempYaml(data: unknown): string {
    const options: TmpNameOptions = { postfix: '.yaml' }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const tmpPath = tmpNameSync(options)

    writeYaml(tmpPath, data)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ path: tmpPath }, 'wrote temp yaml file')
    return tmpPath
  }
}
