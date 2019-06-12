const fs = require('fs')
const Promise = require('bluebird')
const tmp = require('tmp')
const config = require('../config')

const tempFile = Promise.promisify(tmp.file)

const {
  DEPLOYMENT_STATUS,
} = config

const DeploymentRoutes = (controllers) => {

  const list = async (req, res, next) => {
    const data = await controllers.deployment.list({
      user: req.user,
      cluster: req.params.cluster,
      deleted: req.query.showDeleted,
      withTasks: req.query.withTasks,
    })
    res.json(data)
  }

  const get = async (req, res, next) => {
    const data = await controllers.deployment.get({
      id: req.params.id,
      withTask: req.query.withTasks,
    })
    if(!data) {
      res
        .status(404)
        .json({
          error: `no deployment found with id: ${req.params.id}`,
        })
    }
    else {
      res.json(data)
    }
  }

  const create = async (req, res, next) => {
    const data = await controllers.deployment.create({
      user: req.user,
      cluster: req.params.cluster,
      data: req.body,
    })
    res
      .status(201)
      .json(data)
  }

  const update = async (req, res, next) => {
    const data = await controllers.deployment.update({
      id: req.params.id,
      user: req.user,
      data: req.body,
    })
    res
      .status(200)
      .json(data)
  }

  const listTasks = async (req, res, next) => {
    const data = await controllers.deployment.getTasks({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const listRoles = async (req, res, next) => {
    const data = await controllers.deployment.getRoles({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const createRole = async (req, res, next) => {
    const data = await controllers.deployment.createRole({
      id: req.params.id,
      user: req.body.user,
      username: req.body.username,
      permission: req.body.permission,
    })
    res
      .status(201)
      .json(data)
  }

  const deleteRole = async (req, res, next) => {
    const data = await controllers.deployment.deleteRole({
      id: req.params.id,
      user: req.params.userid,
    })
    res
      .status(200)
      .json(data)
  }

  const resources = async (req, res, next) => {
    const data = await controllers.deployment.resources({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const summary = async (req, res, next) => {
    const data = await controllers.deployment.summary({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const del = async (req, res, next) => {

    const deployment = await controllers.deployment.get({
      id: req.params.id,
    })

    let data = null

    if(deployment.status == DEPLOYMENT_STATUS.deleted) {
      data = await controllers.deployment.deletePermenantly({
        id: req.params.id,
        user: req.user,
      })
    }
    else {
      data = await controllers.deployment.delete({
        id: req.params.id,
        user: req.user,
      })
    }
    
    res
      .status(200)
      .json(data)
  }

  const getKeyManagerKeys = async (req, res, next) => {
    const data = await controllers.deployment.getKeyManagerKeys({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const getEnrolledKeys = async (req, res, next) => {
    const data = await controllers.deployment.getEnrolledKeys({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const addEnrolledKey = async (req, res, next) => {
    const data = await controllers.deployment.addEnrolledKey({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(201)
      .json(data)
  }

  const getDamlParticipants = async (req, res, next) => {
    const data = await controllers.deployment.getDamlParticipants({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const getDamlArchives = async (req, res, next) => {
    const data = await controllers.deployment.getDamlArchives({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const getDamlTimeServiceInfo = async (req, res, next) => {
    const data = await controllers.deployment.getDamlTimeServiceInfo({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const registerParticipant = async (req, res, next) => {
    const data = await controllers.deployment.registerParticipant({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(200)
      .json(data)
  }

  const rotateParticipantKey = async (req, res, next) => {
    const data = await controllers.deployment.rotateParticipantKey({
      id: req.params.id,
      publicKey: req.body.publicKey,
    })
    res
      .status(200)
      .json(data)
  }

  const addParty = async (req, res, next) => {
    const data = await controllers.deployment.addParty({
      id: req.params.id,
      publicKey: req.body.publicKey,
      partyName: req.body.partyName,
    })
    res
      .status(201)
      .json(data)
  }

  const removeParties = async (req, res, next) => {
    const data = await controllers.deployment.removeParties({
      id: req.params.id,
      publicKey: req.body.publicKey,
      partyNames: req.body.partyNames,
    })
    res
      .status(200)
      .json(data)
  }

  const generatePartyToken = async (req, res, next) => {
    const data = await controllers.deployment.generatePartyToken({
      id: req.params.id,
      publicKey: req.body.publicKey,
      partyNames: req.body.partyNames,
    })
    res
      .status(200)
      .json(data)
  }

  const uploadArchive = async (req, res, next) => {
    const filepath = await tempFile({
      postfix: '.txt',
    })

    const writeStream = fs.createWriteStream(filepath)

    await new Promise((resolve, reject) => {
      writeStream.on('error', reject)
      writeStream.on('end', resolve)
      req.pipe(writeStream)
    })

    res
      .status(200)
      .json({
        filepath,
      })
  }


  return {
    list,
    get,
    create,
    update,
    listRoles,
    createRole,
    deleteRole,
    listTasks,
    resources,
    summary,
    delete: del,

    getKeyManagerKeys,
    getEnrolledKeys,
    addEnrolledKey,

    getDamlParticipants,
    getDamlArchives,
    getDamlTimeServiceInfo,
    registerParticipant,
    rotateParticipantKey,
    addParty,
    removeParties,
    generatePartyToken,
    uploadArchive,

  }
}

module.exports = DeploymentRoutes