/* eslint-disable no-unused-vars */
const fs = require('fs')
const Promise = require('bluebird')
const tmp = require('tmp')

const tempFile = Promise.promisify(tmp.file)

const DamlRoutes = (controllers) => {
  const getKeyManagerKeys = async (req, res, next) => {
    const data = await controllers.daml.getKeyManagerKeys({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const getEnrolledKeys = async (req, res, next) => {
    const data = await controllers.daml.getEnrolledKeys({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const addEnrolledKey = async (req, res, next) => {
    const data = await controllers.daml.addEnrolledKey({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(201)
      .json(data)
  }

  const getParticipants = async (req, res, next) => {
    const data = await controllers.daml.getParticipants({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const registerParticipant = async (req, res, next) => {
    const data = await controllers.daml.registerParticipant({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(200)
      .json(data)
  }

  const rotateParticipantKey = async (req, res, next) => {
    const data = await controllers.daml.rotateParticipantKey({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(200)
      .json(data)
  }

  const addParty = async (req, res, next) => {
    const data = await controllers.daml.addParty({
      id: req.params.id,
      publicKey: req.body.publicKey,
      partyName: req.body.partyName,
    })
    res
      .status(201)
      .json(data)
  }

  const generatePartyToken = async (req, res, next) => {
    const data = await controllers.daml.generatePartyToken({
      id: req.params.id,
      applicationId: req.body.applicationId,
      readAs: req.body.readAs,
      actAs: req.body.actAs,
    })
    res
      .status(200)
      .json(data)
  }

  const generateAdminToken = async (req, res, next) => {
    const data = await controllers.daml.generateAdminToken({
      id: req.params.id,
      applicationId: req.body.applicationId,
    })
    res
      .status(200)
      .json(data)
  }

  const getArchives = async (req, res, next) => {
    const data = await controllers.daml.getArchives({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const uploadArchive = async (req, res, next) => {
    const {
      name,
      type,
      size,
    } = req.query

    const localFilepath = await tempFile()

    const removeFile = () => {
      fs.unlink(localFilepath, () => {})
    }

    try {
      const writeStream = fs.createWriteStream(localFilepath)

      await new Promise((resolve, reject) => {
        writeStream.on('error', reject)
        req.on('end', resolve)
        req.pipe(writeStream)
      })

      const data = await controllers.daml.uploadArchive({
        id: req.params.id,
        name,
        type,
        size,
        localFilepath,
      })

      removeFile()

      res
        .status(201)
        .json(data)
    } catch (e) {
      removeFile()
      throw e
    }
  }

  const getTimeServiceInfo = async (req, res, next) => {
    const data = await controllers.daml.getTimeServiceInfo({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

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

module.exports = DamlRoutes
