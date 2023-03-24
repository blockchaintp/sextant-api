/* eslint-disable camelcase */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import * as bluebird from 'bluebird'
import * as fs from 'fs'
import * as jwt from 'jsonwebtoken'
import { getLogger } from '../../logging'
import { Store } from '../../store'
import { Deployment } from '../../store/model/model-types'
import { DatabaseIdentifier } from '../../store/model/scalar-types'
import { deploymentReleaseFullName } from '../../utils/deploymentNames'
import { DeploymentPodProxy } from '../../utils/deploymentPodProxy'
import { damlParticipants, damlTimeService, getKey } from './database'
import { Grpcurl } from './grpcurl'
import { SecretLoader } from './secretLoader'
import memoize = require('memoizee')

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'api/damlRPC',
})

const DAML_GRPC_METHOD_PREFIX = 'com.daml.ledger.api.v1.'
const DAML_RPC_PORT = 39000

export type DamlJWTClaim = {
  actAs?: string[]
  admin?: boolean
  applicationId?: string
  ledgerId?: string
  public?: boolean
  readAs?: string[]
}

const getAdminJWTToken = ({ id, store }: { id: DatabaseIdentifier; store: Store }) =>
  getJWTToken({
    id,
    payload: {
      admin: true,
      public: true,
    },
    store,
  })

const getJWTToken = async ({ id, payload, store }: { id: DatabaseIdentifier; payload: DamlJWTClaim; store: Store }) => {
  const privateKey = await getPrivateKey({
    id,
    store,
  })
  return new bluebird.Promise((resolve, reject) => {
    jwt.sign(
      {
        'https://daml.com/ledger-api': payload,
        // eslint-disable-next-line consistent-return
      },
      privateKey,
      {
        algorithm: 'RS256',
      },
      (err, result) => {
        if (err) return reject(err)
        return resolve(result)
      }
    )
  }) as Promise<string>
}

const getPrivateKey = async ({ id, store }: { id: DatabaseIdentifier; store: Store }) => {
  const deployment = await store.deployment.get({
    id,
  })

  const secretLoader = new SecretLoader({
    store,
    id,
  })

  const secretName = getCertSecretName(deployment)
  const secret = await secretLoader.getSecret(secretName)
  if (!secret || !secret.data) throw new Error(`no secret found to sign token ${secretName}`)
  const keyBase64 = secret.data['jwt.key']
  if (!keyBase64) throw new Error(`no value found to sign token ${secretName} -> jwt.key`)
  return Buffer.from(keyBase64, 'base64').toString('utf8')
}

const getCertSecretName = (deployment: Deployment) => {
  const fullName = deploymentReleaseFullName(deployment)
  return `${fullName}-cert`
}

async function callProxy({
  id,
  store,
  handler,
}: {
  handler: (args: { port: number }) => Promise<unknown>
  id: DatabaseIdentifier
  store: Store
}) {
  const proxy = await DeploymentPodProxy({
    store,
    id,
    labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
  })

  const pods = await proxy.getPods()

  if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  logger.debug({ fn: 'getLedgerId', numberOfPods: pods.length }, 'found daml pods')
  if (!pods[0].metadata?.name) throw new Error('The daml-rpc pod cannot be found.')
  return proxy.request({
    pod: pods[0].metadata.name,
    port: DAML_RPC_PORT,
    handler,
  })
}

const m_getLedgerId = ({ id, store }: { id: DatabaseIdentifier; store: Store }) => {
  const handler = async ({ port }: { port: number }) => {
    const token = await getAdminJWTToken({
      id,
      store,
    })
    const grpccurl = Grpcurl({
      token,
      port,
      prefix: DAML_GRPC_METHOD_PREFIX,
    })
    const { ledgerId } = (await grpccurl({
      service: 'LedgerIdentityService',
      method: 'GetLedgerIdentity',
      data: undefined,
    })) as { ledgerId: string }
    return ledgerId
  }

  return callProxy({ id, store, handler }) as Promise<string>
}
const getLedgerId = memoize(m_getLedgerId, { maxAge: 30000, promise: true })

const m_getParticipantId = ({ id, store }: { id: DatabaseIdentifier; store: Store }) => {
  const handler = async ({ port }: { port: number }) => {
    const token = await getAdminJWTToken({
      id,
      store,
    })
    const grpccurl = Grpcurl({
      token,
      port,
      prefix: DAML_GRPC_METHOD_PREFIX,
    })
    const { participantId } = (await grpccurl({
      service: 'admin.PartyManagementService',
      method: 'GetParticipantId',
      data: undefined,
    })) as { participantId: { participantId: string } }
    return participantId
  }

  return callProxy({ id, store, handler }) as Promise<string>
}
const getParticipantId = memoize(m_getParticipantId, { maxAge: 30000, promise: true })

export class DamlRPC {
  private store: Store
  constructor({ store }: { store: Store }) {
    if (!store) {
      throw new Error('Daml rpc requires a store')
    }
    this.store = store
  }

  public async addParty({
    id,
    partyName,
    partyIdHint,
  }: {
    id: DatabaseIdentifier
    partyIdHint: string
    partyName: string
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      fn: 'addParty',
      id,
      partyName,
      partyIdHint,
    })

    const proxy = await DeploymentPodProxy({
      store: this.store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ fn: 'addParty', numberOfPods: pods.length }, 'found daml pods')

    const pod = pods[0]
    if (!pod.metadata?.name) throw new Error('The daml-rpc pod cannot be found.')

    const result = await proxy.request({
      pod: pod.metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
        // eslint-disable-next-line consistent-return
      }) => {
        if (!pod.metadata?.name) throw new Error('The daml-rpc pod cannot be found.')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        logger.debug(`Allocating party to ${pod.metadata.name}`)
        const data = {
          partyIdHint: partyIdHint || partyName,
          displayName: partyName,
        }

        const token = await getAdminJWTToken({
          id,
          store: this.store,
        })

        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })

        const { partyDetails } = (await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'AllocateParty',
          data,
        })) as { partyDetails: { displayName: string }[] }

        return partyDetails
      },
    })
    // eslint-disable-next-line no-unneeded-ternary
    return result ? true : false
  }

  public async generateAdminToken({ id, applicationId }: { applicationId: string; id: DatabaseIdentifier }) {
    if (!applicationId) throw new Error('applicationId must be given to api.damlRPC.generateAdminToken')

    const ledgerId = await getLedgerId({
      id,
      store: this.store,
    })

    return getJWTToken({
      id,
      payload: {
        public: true,
        admin: true,
        ledgerId,
        applicationId,
      },
      store: this.store,
    })
  }

  public async generatePartyToken({
    id,
    applicationId,
    readAs,
    actAs,
  }: {
    actAs: string[]
    applicationId: string
    id: DatabaseIdentifier
    readAs: string[]
  }) {
    if (!applicationId) throw new Error('applicationId must be given to api.damlRPC.generatePartyTokens')
    if (!readAs) throw new Error('readAs must be given to api.damlRPC.generatePartyTokens')
    if (!actAs) throw new Error('actAs must be given to api.damlRPC.generatePartyTokens')

    const ledgerId = await getLedgerId({
      id,
      store: this.store,
    })

    return getJWTToken({
      id,
      payload: {
        public: true,
        ledgerId,
        applicationId,
        readAs,
        actAs,
      },
      store: this.store,
    })
  }

  public async getArchives({ id }: { id: DatabaseIdentifier }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      fn: 'getArchives',
      id,
    })

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store: this.store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ fn: 'getArchives', numberOfPods: pods.length }, 'found daml pods')

    const pod = pods[0]
    if (!pod.metadata?.name) throw new Error('The daml-rpc pod cannot be found.')

    // Extract archive information from one pod only
    // This is regardless of all validator pods
    // reaching consensus
    try {
      return await bluebird.Promise.resolve(
        proxy.request({
          pod: pod.metadata.name,
          port: DAML_RPC_PORT,
          handler: async ({ port }) => {
            const token = await bluebird.Promise.resolve(
              getAdminJWTToken({
                id,
                store: this.store,
              })
            )

            const grpccurl = Grpcurl({
              token,
              port,
              prefix: DAML_GRPC_METHOD_PREFIX,
            })

            const response = (await grpccurl({
              service: 'admin.PackageManagementService',
              method: 'ListKnownPackages',
              data: undefined,
            })) as { packageDetails: unknown[] }
            const packages = response.packageDetails

            return packages ? packages.sort() : []
          },
        })
      )
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.warn({
        fn: 'getArchives',
        error,
      })
      throw error
    }
  }

  public getTimeServiceInfo() {
    return damlTimeService
  }

  public async registerParticipant({ id, publicKey }: { id: DatabaseIdentifier; publicKey: string }) {
    if (!publicKey) throw new Error('publicKey must be given to api.damlRPC.registerParticipant')

    const participantId = await getParticipantId({
      id,
      store: this.store,
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      fn: 'registerParticipant',
      participantId,
      publicKey,
    })

    damlParticipants.push({
      damlId: getKey(),
      participantId,
      publicKey,
      parties: [],
    })

    return damlParticipants
  }

  public updateKey({ oldPublicKey, newPublicKey }: { newPublicKey: string; oldPublicKey: string }) {
    if (!oldPublicKey) throw new Error('oldPublicKey must be given to api.damlRPC.updateKey')
    if (!newPublicKey) throw new Error('newPublicKey must be given to api.damlRPC.updateKey')
    const participant = damlParticipants.find((oneParticipant) => oneParticipant.publicKey === oldPublicKey)
    if (!participant) throw new Error(`no participant found with publicKey ${oldPublicKey}`)
    participant.publicKey = newPublicKey
    return true
  }

  public async uploadArchive({
    id,
    name,
    size,
    localFilepath,
  }: {
    id: DatabaseIdentifier
    localFilepath: string
    name: string
    size: number
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      fn: 'uploadArchive',
      id,
      name,
      size,
      localFilepath,
    })

    const content = fs.readFileSync(localFilepath)
    const contentBase64 = content.toString('base64')

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store: this.store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ fn: 'uploadArchive', numberOfPods: pods.length }, 'found daml pods')

    const pod = pods[0]
    if (!pod.metadata?.name) throw new Error('The daml-rpc pod cannot be found.')

    return proxy.request({
      pod: pod.metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({ port }) => {
        const token = await getAdminJWTToken({
          id,
          store: this.store,
        })

        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })

        const data = {
          dar_file: contentBase64,
        }

        try {
          await grpccurl({
            service: 'admin.PackageManagementService',
            method: 'UploadDarFile',
            data,
          })
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          if (e.toString().indexOf('Invalid DAR') >= 0) {
            throw new Error("that file doesn't look like a DAR file")
          } else {
            throw e
          }
        }

        return grpccurl({
          service: 'admin.PackageManagementService',
          method: 'ListKnownPackages',
          data: undefined,
        })
      },
    })
  }
}
