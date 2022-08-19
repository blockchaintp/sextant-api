/* eslint-disable no-shadow */
import API, { DeploymentBasedRequest, VolumeBasedRequest } from '../api/taekion'
import { StoreType } from '../store'

const TaekionController = ({ store }: { store: StoreType }) => {
  const api = API({
    store,
  })

  const listKeys = ({ deployment }: DeploymentBasedRequest) =>
    api.listKeys({
      deployment,
    })

  const createKey = ({
    deployment,
    name,
  }: DeploymentBasedRequest & {
    name: string
  }) =>
    api.createKey({
      deployment,
      name,
    })

  const listVolumes = ({ deployment }: DeploymentBasedRequest): Promise<any[]> =>
    api.listVolumes({
      deployment,
    })

  const createVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }: DeploymentBasedRequest & {
    name: string
    compression: string
    encryption: string
    fingerprint: string
  }) => {
    if (name === 'all') throw new Error('the name "all" is reserved for the system')

    await api.createVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })
  }

  const updateVolume = ({
    deployment,
    volume,
    name,
  }: VolumeBasedRequest & {
    name: string
  }) =>
    api.updateVolume({
      deployment,
      volume,
      name,
    })

  const deleteVolume = () => api.deleteVolume()

  // curl http://localhost:8000/snapshot?list&volume=apples
  const listSnapshots = async ({ deployment, volume }: VolumeBasedRequest) => {
    // loop over all volumes and concat the data together
    if (volume === 'all') {
      const volumes: any[] = await listVolumes({
        deployment,
      })
      const coll = await Promise.all(volumes.map((v: any) => api.listSnapshots({ deployment, volume: v.uuuid })))

      return coll.flatMap((c) => c)
    }

    return api.listSnapshots({
      deployment,
      volume,
    })
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  const createSnapshot = ({
    deployment,
    volume,
    name,
  }: VolumeBasedRequest & {
    name: string
  }) =>
    api.createSnapshot({
      deployment,
      volume,
      name,
    })

  const deleteSnapshot = () => api.deleteSnapshot()

  const explorerListDirectory = ({
    deployment,
    volume,
    inode,
    snapshot,
  }: VolumeBasedRequest & {
    inode: string
    snapshot: string
  }) =>
    api.explorerListDirectory({
      deployment,
      volume,
      inode,
      snapshot,
    })

  const explorerDownloadFile = ({
    deployment,
    volume,
    directory_inode: directoryINode,
    file_inode: fileINode,
    download_filename: downloadFilename,
    snapshot,
    res,
  }: VolumeBasedRequest & {
    // eslint-disable-next-line camelcase
    directory_inode: string
    // eslint-disable-next-line camelcase
    file_inode: string
    // eslint-disable-next-line camelcase
    download_filename: string
    snapshot: string
    res: any
  }) =>
    api.explorerDownloadFile({
      deployment,
      volume,
      directory_inode: directoryINode,
      file_inode: fileINode,
      download_filename: downloadFilename,
      snapshot,
      res,
    })

  const restApiProxy = ({
    deployment,
    req,
    res,
  }: DeploymentBasedRequest & {
    req: any
    res: any
  }) =>
    api.stlRequestProxy({
      deployment,
      // this will have the network name prepended
      // so will become "tfs-rest-api"
      serviceName: 'rest-api',
      portName: 'rest-api',
      req,
      res,
    })

  return {
    listKeys,
    createKey,
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

export default TaekionController
