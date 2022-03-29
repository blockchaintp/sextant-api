/* eslint eqeqeq: "error" */
const { Agent } = require('https')
const axios = require('axios')
const logger = require('../logging').getLogger({
  name: 'api/taekion',
})
const deploymentHttpConnection = require('../utils/deploymentHttpConnection')

/*
  Utility func that returns a unique id to be used when retrieving a connection from the cache
  The id will be a string with the form: deploymentId-label1-label2
*/
const buildConnectionCacheId = (deploymentId, labels) => {
  const connectionCacheId = Object.keys(labels)
    .sort()
    .reduce((id, key) => `${id}-${key}-${labels[key]}`, deploymentId)
  logger.trace({
    connectionCacheId,
  })
  return connectionCacheId
}

const TaekionAPI = ({ store } = {}) => {
  if (!store) {
    throw new Error('TaekionAPI requires a store')
  }
  const getItemConnection = async ({ deployment, kind, labels = {} }) =>
    deploymentHttpConnection({
      labels,
      store,
      connectionCacheId: buildConnectionCacheId(deployment, labels),
      id: deployment,
      onConnection: async (connection) => {
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

        let items = res.data.items || []
        logger.debug({ providedLabels: labels }, `Selecting ${kind} items based on provided labels"`)
        Object.keys(labels).forEach((key) => {
          items = items.filter((p) => p.metadata && p.metadata.labels && p.metadata.labels[key] === labels[key])
        })
        logger.debug({ providedLabels: labels }, `Selected ${items.length} ${kind} based on provided labels"`)

        if (items.length > 0) {
          const item = items[0]
          connection.itemName = item.metadata.name
          connection.itemBaseUrl = `${kindUrl}/${connection.itemName}`
        } else {
          throw new Error(`no ${kind} was found based on provided labels for deployment ${deployment}`)
        }
      },
    })

  const getPodConnection = async ({ deployment, labels = {} }) =>
    getItemConnection({ deployment, kind: 'pods', labels })

  // this is for speaking to the taekion middleware
  const tfsApiRequest = async ({ deployment, method = 'GET', path, ...extra }) => {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'tfs',
      },
    })

    try {
      const url = `${connection.itemBaseUrl}:8000/proxy${path}`
      const res = await connection.client({
        method,
        url,
        ...extra,
      })
      return res.data
    } catch (e) {
      if (!e.response) {
        throw e
      }
      const errorMessage = JSON.stringify(e.response.data, null, 4)
      const finalError = new Error(errorMessage)
      finalError.response = e.response
      finalError._code = e.response.status
      throw finalError
    }
  }

  // this is for speaking to the sawtooth rest api
  const stlRequestProxy = async ({ deployment, req, res, ...extra }) => {
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
    } catch (e) {
      if (!e.response) {
        logger.error(e)
        res.status(500)
        res.end(e.toString())
      } else {
        const errorMessage = e.response.data.toString().replace(/^Error (\d+):/, (match, code) => code)
        res.status(e.response.status)
        res.end(errorMessage)
      }
    }
  }

  const listKeys = async ({ deployment }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/keystore',
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  const getKey = async ({ deployment, fingerprint }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: `/keystore/${fingerprint}`,
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  const createKey = async ({ deployment, name }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        method: 'POST',
        path: '/keystore',
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
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({ deployment }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/volume',
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no volumes present') >= 0) {
        return []
      }
      throw e
    }
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = ({ deployment, name, compression, encryption, fingerprint }) =>
    tfsApiRequest({
      deployment,
      method: 'post',
      path: '/volume',
      data: {
        id: name,
        compression,
        encryption,
        fingerprint,
      },
    })

  const updateVolume = ({ deployment, volume, name }) =>
    tfsApiRequest({
      deployment,
      method: 'put',
      path: `/volume/${volume}`,
      data: {
        action: 'rename',
        id: name,
      },
    })

  const deleteVolume = async () => {
    throw new Error('endpoint tbc')
  }

  const listSnapshots = async ({ deployment, volume }) => {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/snapshot',
        params: {
          volume,
        },
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no snapshots found') >= 0) {
        return []
      }
      throw e
    }
  }

  const createSnapshot = ({ deployment, volume, name }) =>
    tfsApiRequest({
      deployment,
      method: 'post',
      path: '/snapshot',
      data: {
        volume,
        id: name,
      },
    })

  const deleteSnapshot = async () => {
    throw new Error('endpoint tbc')
  }

  const explorerListDirectory = async ({ deployment, volume, inode, snapshot }) => {
    const data = await tfsApiRequest({
      deployment,
      method: 'get',
      path: `/volume/${volume}/explorer/dir/${inode}`,
      params: {
        snapshot_head: snapshot,
      },
    })
    return data.payload
  }

  const explorerDownloadFile = async ({
    deployment,
    volume,
    directory_inode,
    file_inode,
    download_filename,
    snapshot,
    res,
  }) => {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'tfs',
      },
    })

    try {
      const path = `/volume/${volume}/explorer/dir/${directory_inode}/file/${file_inode}`
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
      if (download_filename) {
        res.set('Content-Disposition', `attachment; filename="${download_filename}"`)
      }
      upstream.data.pipe(res)
    } catch (e) {
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

module.exports = TaekionAPI
