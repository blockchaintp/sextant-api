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
    data = null,
  }) => {
    const proxy = await DeploymentPodProxy({
      store,
      id: deployment,
      label: 'app=<name>-validator'
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
          data,
        })
        return res
      }
    })

    return result
  }

  const listVolumes = async ({
    deployment,
  }) => {
    const res = await apiRequest({
      deployment,
      url: '/volume?list',
    })
    return res.data
  }

  return {
    listVolumes,
  }

}

module.exports = TaekionAPI
