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
  existing,
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
      methods: existing ? [] : [
        ['required', 'The API Server is required'],
      ],
    }
  }, {
    id: 'desired_state.token',
    title: `${ existing ? 'Update ' : ''}Token`,
    helperText: 'Paste the base64 access token',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: existing ? [] : [
        ['required', 'The Token is required'],
      ],
    }
  }, {
    id: 'desired_state.ca',
    title: `${ existing ? 'Update ' : ''}Certificate Authority`,
    helperText: 'Paste the base64 certificate authority',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: existing ? [] : [
        ['required', 'The Certificate Authority is required'],
      ],
    }
  }]
}

const clusterForms = {
  localAdd: localForm,
  localEdit: localForm,
  remoteAdd: getRemoteForm({
    existing: false,
  }),
  remoteEdit: getRemoteForm({
    existing: true,
  })
}

module.exports = clusterForms