/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint eqeqeq: "error" */
const { Agent } = require('https')
const axios = require('axios')
const logger = require('../../logging').getLogger({
  name: 'api/taekion',
})
const { deploymentHttpConnection } = require('./deploymentHttpConnection')

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

const getItemConnection = ({ deployment, kind, labels = {}, store }) =>
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

const getPodConnection = ({ deployment, labels = {}, store }) =>
  getItemConnection({ deployment, kind: 'pods', labels, store })

// this is for speaking to the taekion middleware
const tfsApiRequest = async ({ deployment, method = 'GET', path, store, ...extra }) => {
  const connection = await getPodConnection({
    deployment,
    labels: {
      component: 'tfs',
    },
    store,
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

class TaekionAPI {
  constructor({ store }) {
    if (!store) {
      throw new Error('TaekionAPI requires a store')
    }
    this.store = store
  }

  async createKey({ deployment, name }) {
    try {
      const data = await tfsApiRequest({
        deployment,
        method: 'POST',
        path: '/keystore',
        data: {
          id: name,
          encryption: 'aes_gcm',
        },
        store: this.store,
      })

      const result = data.payload
      const keyData = await this.getKey({
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

  createSnapshot({ deployment, volume, name }) {
    return tfsApiRequest({
      deployment,
      method: 'post',
      path: '/snapshot',
      data: {
        volume,
        id: name,
      },
      store: this.store,
    })
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  createVolume({ deployment, name, compression, encryption, fingerprint }) {
    return tfsApiRequest({
      deployment,
      method: 'post',
      path: '/volume',
      data: {
        id: name,
        compression,
        encryption,
        fingerprint,
      },
      store: this.store,
    })
  }

  deleteSnapshot() {
    throw new Error('endpoint tbc')
  }

  deleteVolume() {
    throw new Error('endpoint tbc')
  }

  async explorerDownloadFile({ deployment, volume, directory_inode, file_inode, download_filename, snapshot, res }) {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'tfs',
      },
      store: this.store,
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

  async explorerListDirectory({ deployment, volume, inode, snapshot }) {
    const data = await tfsApiRequest({
      deployment,
      method: 'get',
      path: `/volume/${volume}/explorer/dir/${inode}`,
      params: {
        snapshot_head: snapshot,
      },
      store: this.store,
    })
    return data.payload
  }

  async getKey({ deployment, fingerprint }) {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: `/keystore/${fingerprint}`,
        store: this.store,
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  async listKeys({ deployment }) {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/keystore',
        store: this.store,
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no keys present') >= 0) {
        return []
      }
      throw e
    }
  }

  async listSnapshots({ deployment, volume }) {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/snapshot',
        params: {
          volume,
        },
        store: this.store,
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no snapshots found') >= 0) {
        return []
      }
      throw e
    }
  }

  // curl http://localhost:8000/volume?list
  async listVolumes({ deployment }) {
    try {
      const data = await tfsApiRequest({
        deployment,
        path: '/volume',
        store: this.store,
      })
      return data.payload
    } catch (e) {
      if (e.response && e.response.status === 404 && e.response.data.indexOf('no volumes present') >= 0) {
        return []
      }
      throw e
    }
  }

  // this is for speaking to the sawtooth rest api
  async stlRequestProxy({ deployment, req, res, ...extra }) {
    const connection = await getPodConnection({
      deployment,
      labels: {
        component: 'sawtooth',
      },
      store: this.store,
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
        const errorMessage = e.response.data.toString().replace(/^Error (\d+):/, (_match, code) => code)
        res.status(e.response.status)
        res.end(errorMessage)
      }
    }
  }

  updateVolume({ deployment, volume, name }) {
    return tfsApiRequest({
      deployment,
      method: 'put',
      path: `/volume/${volume}`,
      data: {
        action: 'rename',
        id: name,
      },
      store: this.store,
    })
  }
}

module.exports = { TaekionAPI }
