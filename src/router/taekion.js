const httpUtils = require('../utils/http')

const TaekionRoutes = (controllers) => {

  const listVolumes = async (req, res, next) => {
    const data = await controllers.taekion.listVolumes({
      
    })
    res
      .status(200)
      .json(data)
  }

  const createVolume = async (req, res, next) => {
    const {
      volumeName,
      compression,
      encryption,
    } = req.body

    if(!volumeName) return httpUtils.badRequest(res, `volumeName required`)
    if(!compression) return httpUtils.badRequest(res, `compression required`)
    if(!encryption) return httpUtils.badRequest(res, `encryption required`)
    
    const data = await controllers.taekion.createVolume({
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
      volumeName,
    } = req.params
    const data = await controllers.taekion.listSnapshots({
      volumeName,
    })
    res
      .status(200)
      .json(data)
  }

  const createSnapshot = async (req, res, next) => {
    const {
      volumeName,
    } = req.params
    const {
      snapshotName,
    } = req.body
    const data = await controllers.taekion.createSnapshot({
      volumeName,
      snapshotName,
    })
    res
      .status(201)
      .json(data)
  }

  return {
    listVolumes,
    createVolume,
    listSnapshots,
    createSnapshot,
  }
}

module.exports = TaekionRoutes