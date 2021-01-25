const KeyPair = require('../utils/sextantKeyPair')
const KeyManager = require('../api/keyManager')
const DamlRPC = require('../api/damlRPC')
const SettingsTP = require('../api/settingsTP')

const DamlController = ({ store }) => {
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

  const getEnrolledKeys = async () => settingsTP.getEnrolledKeys()

  const addEnrolledKey = async ({
    publicKey,
  }) => settingsTP.addEnrolledKey({
    publicKey,
  })

  const getParticipants = async ({
    id,
  }) => damlRPC.getParticipants({
    id,
  })

  const registerParticipant = async ({
    id,
    publicKey,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.registerParticipant')
    if (!publicKey) throw new Error('publicKey must be given to controller.deployment.registerParticipant')

    return damlRPC.registerParticipant({
      id,
      publicKey,
    })
  }

  const rotateParticipantKey = async ({
    id,
    publicKey,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.rotateParticipantKey')
    if (!publicKey) throw new Error('publicKey must be given to controller.deployment.rotateParticipantKey')

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
    partyName,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.addParty')
    if (!partyName) throw new Error('partyName must be given to controller.deployment.addParty')

    await damlRPC.addParty({
      id,
      partyName,
    })

    return true
  }

  const generatePartyToken = async ({
    id,
    applicationId,
    readAs,
    actAs,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.generatePartyToken')
    if (!applicationId) throw new Error('applicationId must be given to controller.deployment.generatePartyToken')
    if (!readAs) throw new Error('readAs must be given to controller.deployment.generatePartyToken')
    if (!actAs) throw new Error('actAs must be given to controller.deployment.generatePartyToken')

    const token = await damlRPC.generatePartyToken({
      id,
      applicationId,
      readAs,
      actAs,
    })

    return {
      token,
    }
  }

  const generateAdminToken = async ({
    id,
    applicationId,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.generatePartyToken')
    if (!applicationId) throw new Error('applicationId must be given to controller.deployment.generatePartyToken')

    const token = await damlRPC.generateAdminToken({
      id,
      applicationId,
    })

    return {
      token,
    }
  }


  const getArchives = async ({
    id,
  }) => damlRPC.getArchives({
    id,
  })

  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  }) => {
    if (!id) throw new Error('id must be given to controller.deployment.uploadArchive')
    if (!name) throw new Error('name must be given to controller.deployment.uploadArchive')
    if (!size) throw new Error('size must be given to controller.deployment.uploadArchive')
    if (!localFilepath) throw new Error('localFilepath must be given to controller.deployment.uploadArchive')

    const data = await damlRPC.uploadArchive({
      id,
      name,
      size,
      localFilepath,
    })

    return data
  }

  const getTimeServiceInfo = async () => damlRPC.getTimeServiceInfo()

  return {
    getKeyManagerKeys,
    getEnrolledKeys,
    addEnrolledKey,

    getParticipants,
    registerParticipant,
    rotateParticipantKey,

    addParty,
    generatePartyToken,
    generateAdminToken,

    getArchives,
    uploadArchive,

    getTimeServiceInfo,
  }
}

module.exports = DamlController
