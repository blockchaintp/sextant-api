import { TaekionAPI } from '../api/taekion/taekion'
import { Store } from '../store'

export class TaekionController {
  api: TaekionAPI

  constructor({ store }: { store: Store }) {
    this.api = new TaekionAPI({
      store,
    })
  }

  public createKey({ deployment, name }: { deployment: number; name: string }) {
    return this.api.createKey({
      deployment,
      name,
    })
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  public createSnapshot({ deployment, volume, name }: { deployment: number; volume: string; name: string }) {
    return this.api.createSnapshot({
      deployment,
      volume,
      name,
    })
  }

  public async createVolume({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }: {
    compression: string
    deployment: number
    encryption: string
    fingerprint: string
    name: string
  }) {
    if (name === 'all') throw new Error('the name "all" is reserved for the system')

    await this.api.createVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })
  }

  public deleteSnapshot({ deployment, id }: { deployment: number; id: number }) {
    return this.api.deleteSnapshot()
  }

  public deleteVolume({ deployment, volume }: { deployment: number; volume: string }) {
    return this.api.deleteVolume()
  }

  public explorerDownloadFile({
    deployment,
    volume,
    directory_inode,
    file_inode,
    download_filename,
    snapshot,
    res,
  }: {
    deployment: number
    directory_inode: number
    download_filename: string
    file_inode: number
    snapshot: string
    volume: string
    res: any
  }) {
    return this.api.explorerDownloadFile({
      deployment,
      volume,
      directory_inode,
      file_inode,
      download_filename,
      snapshot,
      res,
    })
  }

  public explorerListDirectory({
    deployment,
    volume,
    inode,
    snapshot,
  }: {
    deployment: number
    volume: string
    inode: number
    snapshot: string
  }) {
    return this.api.explorerListDirectory({
      deployment,
      volume,
      inode,
      snapshot,
    })
  }

  // curl http://localhost:8000/snapshot?list&volume=apples
  public listKeys({ deployment }: { deployment: number }) {
    return this.api.listKeys({
      deployment,
    })
  }

  public async listSnapshots({ deployment, volume }: { deployment: number; volume: string }) {
    // loop over all volumes and concat the data together
    if (volume === 'all') {
      const volumes = await this.listVolumes({
        deployment,
      })

      const snapshotCollections = await Promise.all(
        volumes.map(async (currentVolume) => {
          await this.listSnapshots({
            deployment,
            volume: currentVolume.uuid,
          })
        })
      )

      return snapshotCollections.reduce((all, snapshotArray) => all.concat(snapshotArray), [])
    }
    return this.api.listSnapshots({
      deployment,
      volume,
    })
  }

  public listVolumes({ deployment }: { deployment: number }) {
    return this.api.listVolumes({
      deployment,
    })
  }

  public restApiProxy({ deployment, req, res }: { deployment: number; req: any; res: any }) {
    return this.api.stlRequestProxy({
      deployment,
      // this will have the network name prepended
      // so will become "tfs-rest-api"
      serviceName: 'rest-api',
      portName: 'rest-api',
      req,
      res,
    })
  }

  public updateVolume({ deployment, volume, name }: { deployment: number; volume: string; name: string }) {
    return this.api.updateVolume({
      deployment,
      volume,
      name,
    })
  }
}

module.exports = TaekionController
