const errorClusters = {
  empty: {
    values: {},
    error: 'data.name required for controllers.cluster.create',
  },
  missingProvisionType: {
    values: {
      name: 'apples',
    },
    error: 'data.provision_type required for controllers.cluster.create',
  },
  missingDesiredState: {
    values: {
      name: 'apples',
      provision_type: 'remote',
    },
    error: 'data.desired_state required for controllers.cluster.create',
  },
  badProvisionType: {
    values: {
      name: 'apples',
      provision_type: 'apples',
      desired_state: {},
    },
    error: 'unknown provision_type: apples',
  },
  missingRemoteCA: {
    values: {
      name: 'apples',
      provision_type: 'remote',
      desired_state: {},
    },
    error: 'desired_state.ca validation error: certificate authority is required',
  },
  missingRemoteToken: {
    values: {
      name: 'apples',
      provision_type: 'remote',
      desired_state: {
        ca: 'apples',
      },
    },
    error: 'desired_state.token validation error: access token is required',
  },
  missingRemoteApiServer: {
    values: {
      name: 'apples',
      provision_type: 'remote',
      desired_state: {
        ca: 'apples',
        token: 'apples',
      },
    },
    error: 'desired_state.apiserver validation error: api server is required',
  },
  malformedRemoteApiServer: {
    values: {
      name: 'apples',
      provision_type: 'remote',
      desired_state: {
        ca: 'apples',
        token: 'apples',
        apiServer: 'apples',
      },
    },
    error: 'desired_state.apiserver validation error: must be a valid url - e.g. http://apiserver.com',
  }
}

module.exports = errorClusters