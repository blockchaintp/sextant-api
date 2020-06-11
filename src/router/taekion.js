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
      name,
      compression,
      encryption,
      fingerprint,
    } = req.body

    if(!name) return httpUtils.badRequest(res, `name required`)
    if(!compression) return httpUtils.badRequest(res, `compression required`)
    if(!encryption) return httpUtils.badRequest(res, `encryption required`)
    if(encryption != 'none' && !fingerprint) return httpUtils.badRequest(res, `fingerprint required`)
    
    const data = await controllers.taekion.createVolume({
      deployment: id,
      name,
      compression,
      encryption,
      fingerprint,
    })
    res
      .status(201)
      .json(data)
  }

  const updateVolume = async (req, res, next) => {
    const {
      id,
      name,
    } = req.params
    const {
      compression,
      encryption,
      fingerprint,
    } = req.body

    if(!compression) return httpUtils.badRequest(res, `compression required`)
    if(!encryption) return httpUtils.badRequest(res, `encryption required`)
    if(encryption != 'none' && !fingerprint) return httpUtils.badRequest(res, `fingerprint required`)
    
    const data = await controllers.taekion.updateVolume({
      deployment: id,
      name,
      compression,
      encryption,
      fingerprint,
    })
    res
      .status(200)
      .json(data)
  }

  const deleteVolume = async (req, res, next) => {
    const {
      id,
      name,
    } = req.params
    
    const data = await controllers.taekion.deleteVolume({
      deployment: id,
      name,
    })
    res
      .status(200)
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
    updateVolume,
    deleteVolume,
    listSnapshots,
    createSnapshot,
  }
}

module.exports = TaekionRoutes