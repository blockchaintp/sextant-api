/* eslint eqeqeq: "error" */
import { Agent } from 'https'
import axios, { AxiosRequestConfig } from 'axios'
import Logging from '../logging'
import deploymentHttpConnection, { DeploymentHttpConnection } from '../utils/deploymentHttpConnection'
import { DatabaseIdentifier } from '../store/domain-types'
import { StoreType } from '../store'

const logger = Logging.getLogger({
  name: 'api/taekion',
})

type LabelsDict = { [key: string]: string }

export type DeploymentBasedRequest = {
  deployment: DatabaseIdentifier
}

export type VolumeBasedRequest = DeploymentBasedRequest & {
  volume: string
}
/*
  Utility func that returns a unique id to be used when retrieving a connection from the cache
  The id will be a string with the form: deploymentId-label1-label2
*/
const buildConnectionCacheId = (deploymentId: DatabaseIdentifier, labels: LabelsDict) => {
  const cacheId = Object.keys(labels)
    .sort()
    .map((key) => `${key}-${labels[key]}`)
    .join('-')
  const connectionCacheId = `${deploymentId}-${cacheId}`
  logger.trace({
    connectionCacheId,
  })
  return connectionCacheId
}

const TaekionAPI = ({ store }: { store?: StoreType } = {}) => {
  if (!store) {
    throw new Error('TaekionAPI requires a store')
  }
  const getItemConnection = async ({
    deployment,
    kind,
    labels = {},
  }: {
    deployment: DatabaseIdentifier
    kind: string
    labels: LabelsDict
  }) => {
    const connection = await deploymentHttpConnection({
      store,
      connectionCacheId: buildConnectionCacheId(deployment, labels),
      id: deployment,
    })

    const kindUrl = `${connection.baseUrl}/${kind}`
    logger.trace('Connecting to %s', kindUrl)
    const res = await axios({
      method: 'GET',
      url: kindUrl,
      headers: {
        Authorization: `Bearer ${connection.token}`,
      },
      httpsAgent: new Agent({
        ca: connection.ca,
      }),
    })

    let items: any = res.data.items || []
    logger.debug({ providedLabels: labels }, `Selecting ${kind} items based on provided labels"`)
    Object.keys(labels).forEach((key) => {
      items = items.filter((p: any) => p.metadata && p.metadata.labels && p.metadata.labels[key] === labels[key])
    })
    logger.debug({ providedLabels: labels }, `Selected ${items.length} ${kind} based on provided labels"`)
    if (items.length > 0) {
      const item = items[0]
      const itemConnection: DeploymentHttpConnection & {
        itemName?: string
        itemBaseUrl?: string
      } = {
        ...connection,
        itemName: item.metadata.name,
        itemBaseUrl: `${kindUrl}/${item.itemName}`,
      }
      return itemConnection
    }
    throw new Error(`no ${kind} was found based on provided labels for deployment ${deployment}`)
  }

  const getPodConnection = ({ deployment, labels = {} }: { deployment: DatabaseIdentifier; labels: LabelsDict }) =>
    getItemConnection({ deployment, kind: 'pods', labels })

  // this is for speaking to the taekion middleware
  const tfsApiRequest = async ({
    deployment,
    method = 'GET',
    url,
    ...extra
  }: DeploymentBasedRequest & AxiosRequestConfig) => {
    const axiosReq: AxiosRequestConfig = {
      method,
      url,
      ...extra,
    }
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'tfs',
      },
    })

    try {
      const fullPath = `${connection.itemBaseUrl}:8000/proxy${url}`
      axiosReq.url = fullPath
      const res = await connection.client(axiosReq)
      return res.data
    } catch (e: any) {
      if (!e.response) {
        throw e
      }
      const errorMessage = JSON.stringify(e.response.data, null, 4)
      e.message = `${e.message} ${errorMessage}`
      // eslint-disable-next-line no-underscore-dangle
      e._code = e.response.status
      throw e
    }
  }

  // this is for speaking to the sawtooth rest api
  const stlRequestProxy = async ({
    deployment,
    req,
    res,
    ...extra
  }: DeploymentBasedRequest & {
    req: any
    res: any
  } & {
    [key: string]: any
  }) => {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'sawtooth',
      },
    })

    const url = `${connection.itemBaseUrl}:8008/proxy${req.url}`
    const useHeaders = { ...req.headers }

    delete useHeaders.host
    delete useHeaders.authorization

    try {
      const upstreamRes = await connection.client({
        method: req.method,
        url,
        headers: useHeaders,
        responseType: 'stream',
        data: req.method.toLowerCase() === 'post' || req.method.toLowerCase() === 'put' ? req : null,
        ...extra,
      })

      res.status(upstreamRes.status)
      res.set(upstreamRes.headers)
      upstreamRes.data.pipe(res)
    } catch (e: any) {
      if (!e.response) {
        logger.error(e)
        res.status(500)
        res.end(e.toString())
      } else {
        const errorMessage = e.response.data.toString().replace(/^Error (\d+):/, (_match: any, code: any) => code)
        res.status(e.response.status)
        res.end(errorMessage)
      }
    }
  }

  const listKeys = async ({ deployment }: DeploymentBasedRequest) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        url: '/keystore',
      })
      return data.payload
    } catch (e: any) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  const getKey = async ({ deployment, fingerprint }: DeploymentBasedRequest & { fingerprint: string }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        url: `/keystore/${fingerprint}`,
      })
      return data.payload
    } catch (e: any) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  const createKey = async ({ deployment, name }: DeploymentBasedRequest & { name: string }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        method: 'POST',
        url: '/keystore',
        data: {
          id: name,
          encryption: 'aes_gcm',
        },
      })

      const result = data.payload
      const keyData = await getKey({
        deployment,
        fingerprint: data.payload.fingerprint,
      })

      return {
        key: Buffer.from(keyData, 'utf8').toString('hex'),
        result,
      }
    } catch (e: any) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({ deployment }: DeploymentBasedRequest) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        url: '/volume',
      })
      return data.payload
    } catch (e: any) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no volumes present') >= 0) {
        return []
      }
      throw e
    }
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = ({
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
  }) =>
    tfsApiRequest({
      deployment,
      method: 'post',
      url: '/volume',
      data: {
        id: name,
        compression,
        encryption,
        fingerprint,
      },
    })

  const updateVolume = ({
    deployment,
    volume,
    name,
  }: VolumeBasedRequest & {
    name: string
  }) =>
    tfsApiRequest({
      deployment,
      method: 'put',
      url: `/volume/${volume}`,
      data: {
        action: 'rename',
        id: name,
      },
    })

  const deleteVolume = () => {
    throw new Error('endpoint tbc')
  }

  const listSnapshots = async ({ deployment, volume }: VolumeBasedRequest): Promise<any[]> => {
    try {
      const data = await tfsApiRequest({
        deployment,
        url: '/snapshot',
        params: {
          volume,
        },
      })
      return data.payload
    } catch (e: any) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no snapshots found') >= 0) {
        return []
      }
      throw e
    }
  }

  const createSnapshot = ({
    deployment,
    volume,
    name,
  }: VolumeBasedRequest & {
    name: string
  }) =>
    tfsApiRequest({
      deployment,
      method: 'post',
      url: '/snapshot',
      data: {
        volume,
        id: name,
      },
    })

  const deleteSnapshot = () => {
    throw new Error('endpoint tbc')
  }

  const explorerListDirectory = async ({
    deployment,
    volume,
    inode,
    snapshot,
  }: VolumeBasedRequest & {
    inode: string
    snapshot: string
  }) => {
    const data = await tfsApiRequest({
      deployment,
      method: 'get',
      url: `/volume/${volume}/explorer/dir/${inode}`,
      params: {
        snapshot_head: snapshot,
      },
    })
    return data.payload
  }

  const explorerDownloadFile = async ({
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
  }) => {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'tfs',
      },
    })

    try {
      const path = `/volume/${volume}/explorer/dir/${directoryINode}/file/${fileINode}`
      const url = `${connection.itemBaseUrl}:8000/proxy${path}`
      const upstream = await connection.client({
        method: 'GET',
        url,
        responseType: 'stream',
        params: {
          snapshot_head: snapshot,
        },
      })
      res.status(200)
      res.set(upstream.headers)
      if (downloadFilename) {
        res.set('Content-Disposition', `attachment; filename="${downloadFilename}"`)
      }
      upstream.data.pipe(res)
    } catch (e: any) {
      res.status(e.response.status)
      e.response.data.pipe(res)
    }
  }

  return {
    listKeys,
    getKey,
    createKey,
    listVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    listSnapshots,
    createSnapshot,
    deleteSnapshot,
    tfsApiRequest,
    stlRequestProxy,
    explorerListDirectory,
    explorerDownloadFile,
  }
}

export default TaekionAPI
