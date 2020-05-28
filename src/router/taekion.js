const TaekionRoutes = (controllers) => {

  const listVolumes = async (req, res, next) => {
    const data = await controllers.taekion.listVolumes({
      
    })
    res
      .status(200)
      .json(data)
  }

  const createVolume = async (req, res, next) => {
    const data = await controllers.taekion.createVolume({
      
    })
    res
      .status(201)
      .json(data)
  }

  const listSnapshots = async (req, res, next) => {
    const data = await controllers.taekion.listSnapshots({
      
    })
    res
      .status(200)
      .json(data)
  }

  const createVolume = async (req, res, next) => {
    const data = await controllers.taekion.createVolume({
      
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