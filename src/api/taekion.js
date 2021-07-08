const deploymentHttpConnection = require('../utils/deploymentHttpConnection');

const TaekionAPI = ({ store } = {}) => {
  if (!store) {
    throw new Error('TaekionAPI requires a store');
  }

  const apiRequest = async ({
    deployment,
    serviceName = 'middleware',
    portName = 'taekionrest',
    method = 'GET',
    path,
    ...extra
  }) => {

    const connection = await deploymentHttpConnection({
      store,
      id: deployment,
    })

    const networkName = connection.applied_state.sawtooth.networkName
    const fullServiceName = [networkName, serviceName].join('-')

    try {
      const url = `${connection.baseUrl}/services/${fullServiceName}:${portName}/proxy${path}`
      const res = await connection.client({
        method,
        url,
        ...extra
      })
      return res.data
    } catch (e) {
      if (!e.response) {
        throw e;
      }
      const errorMessage = JSON.stringify(e.response.data, null, 4)
      const finalError = new Error(errorMessage);
      finalError.response = e.response;
      finalError._code = e.response.status;
      throw finalError;
    }
  };

  const apiRequestProxy = async ({
    deployment,
    serviceName = 'middleware',
    portName = 'taekionrest',
    req,
    res,
    ...extra
  }) => {

    const connection = await deploymentHttpConnection({
      store,
      id: deployment,
    })

    const networkName = connection.applied_state.sawtooth.networkName
    const fullServiceName = [networkName, serviceName].join('-')

    const url = `${connection.baseUrl}/services/${fullServiceName}:${portName}/proxy${req.url}`
    const useHeaders = Object.assign({}, req.headers)

    delete(useHeaders.host)
    delete(useHeaders.authorization)

    try {

      const upstreamRes = await connection.client({
        method: req.method,
        url,
        headers: useHeaders,
        responseType: 'stream',
        data:
          req.method.toLowerCase() === 'post'
          || req.method.toLowerCase() === 'put'
            ? req
            : null,
        ...extra,
      })

      res.status(upstreamRes.status)
      res.set(upstreamRes.headers)
      upstreamRes.data.pipe(res)

    } catch (e) {

      if (!e.response) {
        console.error(e.stack);
        res.status(500);
        res.end(e.toString());
      } else {
        const errorMessage = e.response.data
          .toString()
          .replace(/^Error (\d+):/, (match, code) => code);
        res.status(e.response.status);
        res.end(errorMessage);
      }
    }
  };

  const listKeys = async ({ deployment }) => {
    try {
      const data = await apiRequest({
        deployment,
        path: '/keystore',
      });
      return data.payload
    } catch (e) {
      if (
        e.response
        && e.response.status === 404
        && e.response.data.indexOf('no keys present') >= 0
      ) {
        return [];
      }
      throw e;
    }
  };

  const getKey = async ({
    deployment,
    fingerprint,
  }) => {
    try {
      const data = await apiRequest({
        deployment,
        path: `/keystore/${fingerprint}`,
      });
      return data.payload
    } catch (e) {
      if (
        e.response
        && e.response.status === 404
        && e.response.data.indexOf('no keys present') >= 0
      ) {
        return [];
      }
      throw e;
    }
  };

  const createKey = async ({
    deployment,
    name,
  }) => {
    try {
      const data = await apiRequest({
        deployment,
        method: 'POST',
        path: '/keystore',
        data: {
          id: name,
          encryption: 'aes_gcm',
        },
      });

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
      if (
        e.response
        && e.response.status === 404
        && e.response.data.indexOf('no keys present') >= 0
      ) {
        return [];
      }
      throw e;
    }
  };

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({ deployment }) => {
    try {
      const data = await apiRequest({
        deployment,
        path: '/volume',
      });
      return data.payload
    } catch (e) {
      if (
        e.response
        && e.response.status === 404
        && e.response.data.indexOf('no volumes present') >= 0
      ) {
        return [];
      }
      throw e;
    }
  };

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
    path: '/volume',
    data: {
      id: name,
      compression,
      encryption,
      fingerprint,
    },
  });

  const updateVolume = ({ deployment, volume, name }) => apiRequest({
    deployment,
    method: 'put',
    path: `/volume/${volume}`,
    data: {
      action: 'rename',
      id: name,
    },
  });

  const deleteVolume = async () => {
    throw new Error('endpoint tbc');
  };

  const listSnapshots = async ({ deployment, volume }) => {
    try {
      const data = await apiRequest({
        deployment,
        path: '/snapshot',
        params: {
          volume,
        },
      });
      return data.payload;
    } catch (e) {
      if (
        e.response
        && e.response.status === 404
        && e.response.data.indexOf('no snapshots found') >= 0
      ) {
        return [];
      }
      throw e;
    }
  };

  const createSnapshot = ({ deployment, volume, name }) => apiRequest({
    deployment,
    method: 'post',
    path: '/snapshot',
    data: {
      volume,
      id: name,
    },
  });

  const deleteSnapshot = async () => {
    throw new Error('endpoint tbc');
  };

  const explorerListDirectory = async ({ deployment, volume, inode }) => {
    const data = await apiRequest({
      deployment,
      method: 'get',
      path: `/volume/${volume}/explorer/dir/${inode}`,
    })
    return data.payload;
  }

  const explorerDownloadFile = async ({
    deployment,
    volume,
    directory_inode,
    file_inode,
    download_filename,
    res,
  }) => {
    const connection = await ServiceProxy({
      store,
      id: deployment,
    })

    const networkName = connection.applied_state.sawtooth.networkName
    const fullServiceName = [networkName, 'middleware'].join('-')

    try {
      const url = `${connection.baseUrl}/${fullServiceName}:taekionrest/proxy/volume/${volume}/explorer/dir/${directory_inode}/file/${file_inode}`
      const upstream = await connection.client({
        method: 'GET',
        url,
        responseType: 'stream'
      })
      res.status(200)
      res.set(upstream.headers)
      if(download_filename) {
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
    apiRequest,
    apiRequestProxy,
    explorerListDirectory,
    explorerDownloadFile,
  };
};

module.exports = TaekionAPI;
