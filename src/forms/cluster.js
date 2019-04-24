const localForm = [{
  id: 'name',
  title: `Name`,
  helperText: 'Enter the name of the cluster',
  component: 'text',
  validate: {
    type: 'string',
    methods: [
      ['required', 'The name is required'],
    ],
  }
}]

const getRemoteForm = ({
  connectionRequired,
}) => {
  return [{
    id: 'name',
    title: `Name`,
    helperText: 'Enter the name of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        ['required', 'The name is required'],
      ],
    }
  }, {
    id: 'desired_state.apiServer',
    title: `API Server`,
    helperText: 'Enter the URL for your API server',
    component: 'text',
    validate: {
      type: 'string',
      methods: connectionRequired ? [
        ['required', 'The API Server is required'],
      ] : [],
    }
  }, {
    id: 'desired_state.token',
    title: `Token`,
    helperText: 'Paste the base64 access token',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: connectionRequired ? [
        ['required', 'The Token is required'],
      ] : [],
    }
  }, {
    id: 'desired_state.ca',
    title: `Certificate Authority`,
    helperText: 'Paste the base64 certificate authority',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: connectionRequired ? [
        ['required', 'The Certificate Authority is required'],
      ] : [],
    }
  }]
}

const clusterForms = {
  localAdd: localForm,
  localEdit: localForm,
  remoteAdd: getRemoteForm({
    connectionRequired: true,
  }),
  remoteEdit: getRemoteForm({
    connectionRequired: false,
  })
}

module.exports = clusterForms