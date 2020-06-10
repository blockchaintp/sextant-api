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

    const result = await proxy.request({
      pod: pod.metadata.name,
      port: 8000,
      handler: async ({
        port,
      }) => {
        const res = await axios({
          method,
          url: `http://localhost:${port}${url}`,
          ...extra
        })
        return res
      }
    })

    return result
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({
    deployment,
  }) => {
    const res = await apiRequest({
      deployment,
      url: '/volume?list',
    })
    return res.data
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => {
    const res = await apiRequest({
      deployment,
      url: '/volume',
      params: {
        create: name,
        compression,
        encryption,
        fingerprint,
      },
    })
    return res.data
  }

  return {
    listVolumes,
    createVolume,
  }

}

module.exports = TaekionAPI
