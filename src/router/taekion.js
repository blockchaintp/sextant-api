/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
function badRequest(res, error = 'The request was bad', code = 400) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  res.status(code).json({
    error,
  })
}

const TaekionRoutes = (controllers) => {
  const listKeys = async (req, res, next) => {
    const { id } = req.params
    const data = await controllers.taekion.listKeys({
      deployment: id,
    })
    res.status(200).json(data)
  }

  const createKey = async (req, res, next) => {
    const { id } = req.params
    const { name } = req.body

    if (!name) return badRequest(res, `name required`)

    const data = await controllers.taekion.createKey({
      deployment: id,
      name,
    })
    res.status(201).json(data)
  }

  const deleteKey = async (req, res, next) => {
    const { id, keyId } = req.params

    const data = await controllers.taekion.deleteKey({
      deployment: id,
      id: keyId,
    })
    res.status(201).json(data)
  }

  const listVolumes = async (req, res, next) => {
    const { id } = req.params
    const data = await controllers.taekion.listVolumes({
      deployment: id,
    })
    res.status(200).json(data)
  }

  const createVolume = async (req, res, next) => {
    const { id } = req.params
    const { name, compression, encryption, fingerprint } = req.body

    if (!name) return badRequest(res, `name required`)
    if (!compression) return badRequest(res, `compression required`)
    if (!encryption) return badRequest(res, `encryption required`)
    if (encryption != 'NONE' && !fingerprint) return badRequest(res, `fingerprint required`)

    const data = await controllers.taekion.createVolume({
      deployment: id,
      name,
      compression,
      encryption,
      fingerprint,
    })
    res.status(201).json(data)
  }

  const updateVolume = async (req, res, next) => {
    const { id, volume } = req.params
    const { name } = req.body

    const data = await controllers.taekion.updateVolume({
      deployment: id,
      volume,
      name,
    })
    res.status(200).json(data)
  }

  const deleteVolume = async (req, res, next) => {
    const { id, volume } = req.params

    const data = await controllers.taekion.deleteVolume({
      deployment: id,
      volume,
    })
    res.status(200).json(data)
  }

  const listSnapshots = async (req, res, next) => {
    const { id, volume } = req.params
    const data = await controllers.taekion.listSnapshots({
      deployment: id,
      volume,
    })
    res.status(200).json(data)
  }

  const createSnapshot = async (req, res, next) => {
    const { id, volume } = req.params
    const { name } = req.body

    if (!name) return badRequest(res, `name required`)

    const data = await controllers.taekion.createSnapshot({
      deployment: id,
      volume,
      name,
    })
    res.status(201).json(data)
  }

  const deleteSnapshot = async (req, res, next) => {
    const { id, volume, snapshotName } = req.params

    const data = await controllers.taekion.deleteSnapshot({
      deployment: id,
      volume,
      snapshotName,
    })
    res.status(200).json(data)
  }

  const explorerListDirectory = async (req, res, next) => {
    const { id, volume, inode } = req.params

    const { snapshot } = req.query

    const data = await controllers.taekion.explorerListDirectory({
      deployment: id,
      volume,
      inode,
      snapshot,
    })
    res.status(200).json(data)
  }

  const explorerDownloadFile = async (req, res, next) => {
    const { id, volume, directory_inode, file_inode } = req.params

    const { download_filename, snapshot } = req.query

    await controllers.taekion.explorerDownloadFile({
      deployment: id,
      volume,
      directory_inode,
      file_inode,
      download_filename,
      snapshot,
      res,
    })
  }

  const restApiProxy = (req, res, next) =>
    controllers.taekion.restApiProxy({
      deployment: req.params.id,
      req,
      res,
    })

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
    deleteSnapshot,
    explorerListDirectory,
    explorerDownloadFile,
    restApiProxy,
  }
}

module.exports = TaekionRoutes
