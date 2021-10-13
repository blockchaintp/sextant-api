/* eslint-disable no-shadow */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const jwt = require('jsonwebtoken')
const Promise = require('bluebird')
const fs = require('fs')

const logger = require('../logging').getLogger({
  name: 'api/damlRPC',
})
const database = require('./database')
const deploymentNames = require('../utils/deploymentNames')

const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const SecretLoader = require('../utils/secretLoader')
const Grpcurl = require('../utils/grpcurl')

const DAML_GRPC_METHOD_PREFIX = 'com.daml.ledger.api.v1.'
const DAML_RPC_PORT = 39000

const DamlRPC = ({
  store,
} = {}) => {
  if (!store) {
    throw new Error('Daml rpc requires a store')
  }

  const getCertSecretName = (deployment) => {
    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const {
      name,
    } = modelRelease

    const chartName = deploymentNames.getChartNameForDeployment(deployment)

    return `${name}-${chartName}-cert`
  }

  const getPrivateKey = async ({
    id,
  }) => {
    const deployment = await store.deployment.get({
      id,
    })

    const secretLoader = await SecretLoader({
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

  const getJWTToken = async ({
    id,
    payload,
  }) => {
    const privateKey = await getPrivateKey({
      id,
    })
    return new Promise((resolve, reject) => {
      jwt.sign({
        'https://daml.com/ledger-api': payload,
      // eslint-disable-next-line consistent-return
      }, privateKey, {
        algorithm: 'RS256',
      }, (err, result) => {
        if (err) return reject(err)
        return resolve(result)
      })
    })
  }

  const getAdminJWTToken = async ({
    id,
  }) => getJWTToken({
    id,
    payload: {
      admin: true,
      public: true,
    },
  })

  // eslint-disable-next-line max-len
  // grpcurl -plaintext -H 'Authorization: Bearer 123' localhost:39000 com.daml.ledger.api.v1.LedgerIdentityService.GetLedgerIdentity
  const getLedgerId = async ({
    id,
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    return proxy.request({
      pod: pods[0].metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      }) => {
        const token = await getAdminJWTToken({
          id,
        })
        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })
        const {
          innerLedgerId,
        } = await grpccurl({
          service: 'LedgerIdentityService',
          method: 'GetLedgerIdentity',
        })
        return innerLedgerId
      },
    })
  }

  const getParticipantId = async ({
    id,
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    return proxy.request({
      pod: pods[0].metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      }) => {
        const token = await getAdminJWTToken({
          id,
        })
        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })
        const {
          innerParticipantId,
        } = await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'GetParticipantId',
        })
        return innerParticipantId
      },
    })
  }

  const getParticipants = async ({ id }) => {
    logger.info({
      action: 'getParticipants',
      id,
    })
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const token = await getAdminJWTToken({
      id,
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    return Promise.map(pods, async (pod) => proxy.request({
      pod: pod ? pod.metadata.name : null,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      }) => {
        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })

        const ledgerId = await getLedgerId({
          id,
        })

        const {
          participantId,
        } = await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'GetParticipantId',
        })

        const {
          partyDetails = [],
        } = await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'ListKnownParties',
        })

        const partyNames = partyDetails.map((item) => ({
          name: item.displayName,
        }))

        return {
          participantId,
          damlId: `${ledgerId}-${pod.metadata.name}`,
          parties: partyNames,
        };
      },
    }))
  }

  const getParticipantDetails = async ({
    id,
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    return Promise.map(pods, async (pod) => proxy.request({
      pod: pod.metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      }) => {
        const token = await getAdminJWTToken({
          id,
        })
        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })
        const {
          participantId,
        } = await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'GetParticipantId',
        })
        return {
          validator: pod.metadata.name,
          participantId: participantId.participantId,
        }
      },
    }))
  }

  const registerParticipant = async ({
    id,
    publicKey,
  }) => {
    if (!publicKey) throw new Error('publicKey must be given to api.damlRPC.registerParticipant')

    const participantId = await getParticipantId({
      id,
    })
    logger.info({
      action: 'registerParticipant',
      participantId,
      publicKey,
    })

    database.damlParticipants.push({
      damlId: database.getKey(),
      participantId,
      publicKey,
      parties: [],
    })

    return database.damlParticipants
  }

  const updateKey = ({
    oldPublicKey,
    newPublicKey,
  }) => {
    if (!oldPublicKey) throw new Error('oldPublicKey must be given to api.damlRPC.updateKey')
    if (!newPublicKey) throw new Error('newPublicKey must be given to api.damlRPC.updateKey')
    const participant = database.damlParticipants.find((oneParticipant) => oneParticipant.publicKey === oldPublicKey)
    if (!participant) throw new Error(`no participant found with publicKey ${oldPublicKey}`)
    participant.publicKey = newPublicKey
    return true
  }

  const addParty = async ({
    id,
    partyName,
    partyIdHint,
  }) => {
    logger.info({
      action: 'addParty',
      id,
      partyName,
      partyIdHint,
    })

    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const pod = pods[0]

    const result = await proxy.request({
      pod: pod.metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      // eslint-disable-next-line consistent-return
      }) => {
        logger.debug(`Allocating party to ${pod.metadata.name}`)
        const data = {
          partyIdHint: partyIdHint || partyName,
          displayName: partyName,
        }

        const token = await getAdminJWTToken({
          id,
        })

        const grpccurl = Grpcurl({
          token,
          port,
          prefix: DAML_GRPC_METHOD_PREFIX,
        })

        const {
          partyDetails,
        } = await grpccurl({
          service: 'admin.PartyManagementService',
          method: 'AllocateParty',
          data,
        })

        return partyDetails
      },
    })
    // eslint-disable-next-line no-unneeded-ternary
    return result ? true : false
  }

  const generatePartyToken = async ({
    id,
    applicationId,
    readAs,
    actAs,
  }) => {
    if (!applicationId) throw new Error('applicationId must be given to api.damlRPC.generatePartyTokens')
    if (!readAs) throw new Error('readAs must be given to api.damlRPC.generatePartyTokens')
    if (!actAs) throw new Error('actAs must be given to api.damlRPC.generatePartyTokens')

    const ledgerId = await getLedgerId({
      id,
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
    })
  }

  const generateAdminToken = async ({
    id,
    applicationId,
  }) => {
    if (!applicationId) throw new Error('applicationId must be given to api.damlRPC.generateAdminToken')

    const ledgerId = await getLedgerId({
      id,
    })

    return getJWTToken({
      id,
      payload: {
        public: true,
        admin: true,
        ledgerId,
        applicationId,
      },
    })
  }

  const getArchives = async ({
    id,
  } = {}) => {
    logger.info({
      action: 'getArchives',
      id,
    })

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const pod = pods[0]

    // Extract archive information from one pod only
    // This is regardless of all validator pods
    // reaching consensus
    try {
      return await Promise.resolve(proxy.request({
        pod: pod.metadata.name,
        port: DAML_RPC_PORT,
        handler: async ({
          port,
        }) => {
          const token = await Promise.resolve(getAdminJWTToken({
            id,
          }))

          const grpccurl = Grpcurl({
            token,
            port,
            prefix: DAML_GRPC_METHOD_PREFIX,
          })

          const response = await grpccurl({
            service: 'admin.PackageManagementService',
            method: 'ListKnownPackages',
          })
          const packages = response.packageDetails

          return packages ? packages.sort() : []
        },
      }))
    } catch (error) {
      logger.error({
        action: getArchives,
      })
      return error
    }
  }

  const getTimeServiceInfo = () => database.damlTimeService

  // eslint-disable-next-line max-len
  // grpcurl -plaintext -H 'Authorization: Bearer 123' -d '{"dar_file": "ABC"}' localhost:39000 com.daml.ledger.api.v1.admin.PackageManagementService.UploadDarFile
  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  } = {}) => {
    logger.info({
      action: 'uploadArchive',
      id,
      name,
      size,
      localFilepath,
    })

    const content = fs.readFileSync(localFilepath);
    const contentBase64 = content.toString('base64');

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const pod = pods[0]

    return proxy.request({
      pod: pod.metadata.name,
      port: DAML_RPC_PORT,
      handler: async ({
        port,
      }) => {
        const token = await getAdminJWTToken({
          id,
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
          if (e.toString().indexOf('Invalid DAR') >= 0) {
            throw new Error('that file doesn\'t look like a DAR file')
          } else {
            throw e
          }
        }

        return grpccurl({
          service: 'admin.PackageManagementService',
          method: 'ListKnownPackages',
        })
      },
    })
  }

  return {
    getParticipants,
    getParticipantDetails,
    registerParticipant,
    addParty,
    updateKey,
    generatePartyToken,
    generateAdminToken,
    getArchives,
    uploadArchive,
    getTimeServiceInfo,
  }
}

module.exports = DamlRPC
