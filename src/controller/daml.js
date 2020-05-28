const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const KeyPair = require('../utils/sextantKeyPair')
const KeyManager = require('../api/keyManager')
const DamlRPC = require('../api/damlRPC')
const SettingsTP = require('../api/settingsTP')
const ledger = require('@digitalasset/daml-ledger')

const DamlController = ({ store, settings }) => {

  const keyManager = KeyManager({
    store,
  })
  const damlRPC = DamlRPC({
    store,
  })
  const settingsTP = SettingsTP()

  const getKeyManagerKeys = async ({
    id,
  }) => {
    const keyPair = await KeyPair.get({
      store,
      deployment: id,
    })

    return keyManager.getKeys({
      id,
      sextantPublicKey: keyPair.publicKey,
    })
  }

  const getEnrolledKeys = async ({
    id,
  }) => {
    return settingsTP.getEnrolledKeys()
  }

  const addEnrolledKey = async ({
    id,
    publicKey,
  }) => {
    return settingsTP.addEnrolledKey({
      publicKey,
    })
  }

  const getParticipants = async ({
    id,
  }) => {
    return damlRPC.getParticipants({
      id
    })
  }

  const registerParticipant = async ({
    id,
    publicKey,
  }) => {

    if(!id) throw new Error(`id must be given to controller.deployment.registerParticipant`)
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.registerParticipant`)

    // Connection to DAML sawtooth rpc via GRPC.
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: "daml=<name>-daml-rpc"
    })

    const pods = await proxy.getPods()
    const participantId = await proxy.request({
      pod: pods[0].metadata.name,
      port: 39000,
      handler: async ({
        port, // the local host port given to you
      }) => {
        const client = await ledger.DamlLedgerClient.connect({host: "localhost", port})
        const participantId = await client.partyManagementClient.getParticipantId();
        return participantId.participantId;
      }
    })

    return damlRPC.registerParticipant({
      participantId,
      publicKey,
    })
  }

  const rotateParticipantKey = async ({
    id,
    publicKey,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.rotateParticipantKey`)
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.rotateParticipantKey`)

    const newKey = await keyManager.rotateRPCKey({
      publicKey,
    })

    await damlRPC.updateKey({
      oldPublicKey: publicKey,
      newPublicKey: newKey,
    })

    return true
  }

  const addParty = async ({
    id,
    publicKey,
    partyName,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.addParty`)
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.addParty`)
    if(!partyName) throw new Error(`partyName must be given to controller.deployment.addParty`)

    await damlRPC.addParty({
      id,
      publicKey,
      partyName,
    })

    return true
  }

  const removeParties = async ({
    id,
    publicKey,
    partyNames,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.removeParties`)
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.removeParties`)
    if(!partyNames) throw new Error(`partyNames must be given to controller.deployment.removeParties`)

    await damlRPC.removeParties({
      publicKey,
      partyNames,
    })

    return true
  }

  const generatePartyToken = async ({
    id,
    publicKey,
    partyNames,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.generatePartyToken`)
    if(!publicKey) throw new Error(`publicKey must be given to controller.deployment.generatePartyToken`)
    if(!partyNames) throw new Error(`partyNames must be given to controller.deployment.generatePartyToken`)

    const token = await damlRPC.generatePartyToken({
      publicKey,
      partyNames,
    })

    return {
      token,
    }
  }

  const getArchives = async ({
    id,
  }) => {
    return damlRPC.getArchives({
      id,
    })
  }

  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.uploadArchive`)
    if(!name) throw new Error(`name must be given to controller.deployment.uploadArchive`)
    if(!size) throw new Error(`size must be given to controller.deployment.uploadArchive`)
    if(!localFilepath) throw new Error(`localFilepath must be given to controller.deployment.uploadArchive`)

    const data = await damlRPC.uploadArchive({
      id,
      name,
      size,
      localFilepath,
    })

    return data
  }

  const getTimeServiceInfo = async ({
    id,
  }) => {
    return damlRPC.getTimeServiceInfo()
  }

  return {
    getKeyManagerKeys,
    getEnrolledKeys,
    addEnrolledKey,

    getParticipants,
    registerParticipant,
    rotateParticipantKey,

    addParty,
    removeParties,
    generatePartyToken,

    getArchives,
    uploadArchive,

    getTimeServiceInfo,
  }

}

module.exports = DamlController
