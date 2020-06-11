const axios = require('axios')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')

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
      finalError._code = e.response.status
      throw finalError
    }
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({
    deployment,
  }) => {
    const data = await apiRequest({
      deployment,
      url: '/volume?list',
    })
    return data
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => {
    const data = await apiRequest({
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
    return data
  }

  const updateVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => {
    throw new Error(`endpoint tbc`)
  }

  const deleteVolume = async ({
    deployment,
    name,
  }) => {
    throw new Error(`endpoint tbc`)
  }

  const listSnapshots = async ({
    deployment,
    volume,
  }) => {
    const data = await apiRequest({
      deployment,
      method: 'get',
      url: '/snapshot',
      params: {
        volume,
      }
    })
    return data
  }

  return {
    listVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    listSnapshots,
  }

}

module.exports = TaekionAPI
