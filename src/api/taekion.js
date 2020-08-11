const bodyParser = require('body-parser')
const axios = require('axios')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const utils = require('../utils/taekion')

const TaekionAPI = ({
  store,
} = {}) => {

  if (!store) {
    throw new Error("TaekionAPI requires a store")
  }

  const apiRequest = async ({
    deployment,
    method = 'get',
    url = '/',
    podPort = 8000,
    ...extra
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id: deployment,
    })

    const pod = await proxy.getPod()
    
    if(!pod) throw new Error(`no pod found`)

    try {
      const res = await proxy.request({
        pod: pod.metadata.name,
        port: podPort,
        handler: ({
          port,
        }) => axios({
          method,
          url: `http://localhost:${port}${url}`,
          ...extra
        })
      })
      return res.data
    } catch(e) {
      if(!e.response) {
        throw e
      }
      const errorMessage = e.response.data
        .toString()
        .replace(/^Error (\d+):/, (match, code) => code)
      const finalError = new Error(errorMessage)
      finalError.response = e.response
      finalError._code = e.response.status
      throw finalError
    }
  }

  const apiStreamRequest = async ({
    deployment,
    podPort = 8000,
    req,
    res,
    ...extra
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id: deployment,
    })

    const pod = await proxy.getPod()
    
    if(!pod) throw new Error(`no pod found`)

    try {
      await proxy.request({
        pod: pod.metadata.name,
        port: podPort,
        handler: async ({
          port,
        }) => {
          try {
            console.log(`${req.method} ${req.url}`)
            const upstreamRes = await axios({
              method: req.method,
              url: `http://localhost:${port}${req.url}`,
              headers: req.headers,
              responseType: 'stream',
              data: req.method.toLowerCase() == 'post' || req.method.toLowerCase() == 'put' ? req : null,
              ...extra
            })
            res.status(upstreamRes.status)
            res.set(upstreamRes.headers)
            upstreamRes.data.pipe(res)
          } catch(e) {
            const errorMessage = e.response.data
              .toString()
              .replace(/^Error (\d+):/, (match, code) => code)
            res.status(e.response.status)
            res.end(errorMessage)
          }
        }
      })
    } catch(e) {
      if(!e.response) {
        console.error(e.stack)
        res.status(500)
        res.end(e.toString())
      }
      else {
        const errorMessage = e.response.data
          .toString()
          .replace(/^Error (\d+):/, (match, code) => code)
        res.status(e.response.status)
        res.end(errorMessage)
      }
    }
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({
    deployment,
  }) => {
    try {
      const data = await apiRequest({
        deployment,
        url: '/volume',
      })
      return utils.processVolumeResponse(data)
    } catch(e) {
      if(e.response && e.response.status == 404 && e.response.data.indexOf('no volumes present') >= 0) {
        return []
      }
      else {
        throw e
      }      
    } 
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => apiRequest({
    deployment,
    method: 'post',
    url: '/volume',
    data: {
      id: name,
      compression,
      encryption,
      fingerprint,
    }
  })

  const updateVolume = ({
    deployment,
    volume,
    name,
  }) => apiRequest({
    deployment,
    method: 'put',
    url: `/volume/${volume}`,
    data: {
      action: 'rename',
      id: name,
    }
  })

  const deleteVolume = async ({
    deployment,
    volume,
  }) => {
    throw new Error(`endpoint tbc`)
  }

  const listSnapshots = async ({
    deployment,
    volume,
  }) => {
    try {
      const data = await apiRequest({
        deployment,
        method: 'get',
        url: '/snapshot',
        params: {
          volume,
        }
      })
      return utils.processSnapshotResponse(data)
    } catch(e) {
      if(e.response && e.response.status == 404 && e.response.data.indexOf('no snapshots found') >= 0) {
        return []
      }
      else {
        throw e
      }      
    }
  }

  const createSnapshot = ({
    deployment,
    volume,
    name,
  }) => apiRequest({
    deployment,
    method: 'post',
    url: '/snapshot',
    data: {
      volume,
      id: name,
    }
  })

  const deleteSnapshot = async ({
    deployment,
    id,
  }) => {
    throw new Error(`endpoint tbc`)
  }

  return {
    listVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    listSnapshots,
    createSnapshot,
    deleteSnapshot,
    apiRequest,
    apiStreamRequest,
  }

}

module.exports = TaekionAPI
