const httpUtils = require('../utils/http')

const TaekionRoutes = (controllers) => {

  const listKeys = async (req, res, next) => {
    const {
      id,
    } = req.params
    const data = await controllers.taekion.listKeys({
      deployment: id,
    })
    res
      .status(200)
      .json(data)
  }

  const createKey = async (req, res, next) => {
    const {
      id,
    } = req.params
    const {
      name,
    } = req.body

    if(!name) return httpUtils.badRequest(res, `name required`)
    
    const data = await controllers.taekion.createKey({
      deployment: id,
      name,
    })
    res
      .status(201)
      .json(data)
  }

  const deleteKey = async (req, res, next) => {
    const {
      id,
      keyId,
    } = req.params
    
    const data = await controllers.taekion.deleteKey({
      deployment: id,
      id: keyId,
    })
    res
      .status(201)
      .json(data)
  }

  const listVolumes = async (req, res, next) => {
    const {
      id,
    } = req.params
    const data = await controllers.taekion.listVolumes({
      deployment: id,
    })
    res
      .status(200)
      .json(data)
  }

  const createVolume = async (req, res, next) => {
    const {
      id,
    } = req.params
    const {
      volumeName,
      compression,
      encryption,
    } = req.body

    if(!volumeName) return httpUtils.badRequest(res, `volumeName required`)
    if(!compression) return httpUtils.badRequest(res, `compression required`)
    if(!encryption) return httpUtils.badRequest(res, `encryption required`)
    
    const data = await controllers.taekion.createVolume({
      deployment: id,
      volumeName,
      compression,
      encryption,
    })
    res
      .status(201)
      .json(data)
  }

  const listSnapshots = async (req, res, next) => {
    const {
      id,
      volumeName,
    } = req.params
    const data = await controllers.taekion.listSnapshots({
      deployment: id,
      volumeName,
    })
    res
      .status(200)
      .json(data)
  }

  const createSnapshot = async (req, res, next) => {
    const {
      id,
      volumeName,
    } = req.params
    const {
      snapshotName,
    } = req.body

    if(!snapshotName) return httpUtils.badRequest(res, `snapshotName required`)

    const data = await controllers.taekion.createSnapshot({
      deployment: id,
      volumeName,
      snapshotName,
    })
    res
      .status(201)
      .json(data)
  }

  return {
    listKeys,
    createKey,
    deleteKey,
    listVolumes,
    createVolume,
    listSnapshots,
    createSnapshot,
  }
}

module.exports = TaekionRoutes