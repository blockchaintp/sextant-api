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
        port: 8000,
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
      const errorMessage = e.response.data
        .toString()
        .replace(/^Error (\d+):/, (match, code) => code)
      const finalError = new Error(errorMessage)
      finalError.response = e.response
      finalError._code = e.response.status
      throw finalError
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

  const listSnapshots = ({
    deployment,
    volume,
  }) => apiRequest({
    deployment,
    method: 'get',
    url: '/snapshot',
    params: {
      volume,
    }
  }).then(data => utils.processSnapshotResponse(data))
  
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
  }

}

module.exports = TaekionAPI
