/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */

import { TaekionAPI } from '../api/taekion/taekion'
import { Store } from '../store'

export class TaekionController {
  private api: TaekionAPI
  private store: Store

  constructor({ store }) {
    this.store = store
    this.api = new TaekionAPI({
      store,
    })
  }

  public createKey({ deployment, name }) {
    return this.api.createKey({
      deployment,
      name,
    })
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  public createSnapshot({ deployment, volume, name }) {
    return this.api.createSnapshot({
      deployment,
      volume,
      name,
    })
  }

  public createVolume({ deployment, name, compression, encryption, fingerprint }) {
    if (name === 'all') throw new Error('the name "all" is reserved for the system')

    return this.api.createVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })
  }

  public deleteSnapshot() {
    return this.api.deleteSnapshot()
  }

  public deleteVolume() {
    return this.api.deleteVolume()
  }

  public explorerDownloadFile({ deployment, volume, directory_inode, file_inode, download_filename, snapshot, res }) {
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

  public explorerListDirectory({ deployment, volume, inode, snapshot }) {
    return this.api.explorerListDirectory({
      deployment,
      volume,
      inode,
      snapshot,
    })
  }

  public listKeys({ deployment }) {
    return this.api.listKeys({
      deployment,
    })
  }

  // curl http://localhost:8000/snapshot?list&volume=apples
  public async listSnapshots({ deployment, volume }) {
    // loop over all volumes and concat the data together
    if (volume === 'all') {
      const volumes = await this.listVolumes({
        deployment,
      })

      const snapshotCollections = await Promise.all(
        volumes.map((currentVolume) => {
          return this.listSnapshots({
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

  public listVolumes({ deployment }) {
    return this.api.listVolumes({
      deployment,
    })
  }

  public restApiProxy({ deployment, req, res }) {
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

  public updateVolume({ deployment, volume, name }) {
    return this.api.updateVolume({
      deployment,
      volume,
      name,
    })
  }
}
