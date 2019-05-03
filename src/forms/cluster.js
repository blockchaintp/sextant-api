const builder = require('./builder')

const validators = {
  url: ['url', 'Must be a valid url - e.g. http://apiserver.com'],
}

const fields = {
  name: {
    id: 'name',
    title: `Name`,
    helperText: 'Enter the name of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [],
    },
  },
  apiServer: {
    id: 'desired_state.apiServer',
    title: `API Server`,
    helperText: 'Enter the URL for your API server',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        validators.url,
      ],
    },
  },
  token: {
    id: 'desired_state.token',
    title: `Access Token`,
    helperText: 'Paste the base64 access token',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: [],
    },
  },
  ca: {
    id: 'desired_state.ca',
    title: `Certificate Authority`,
    helperText: 'Paste the base64 certificate authority',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: [],
    },
  },
}

const getLocalForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
    ],
    required,
  })
}

const getRemoteForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
      'apiServer',
      'token',
      'ca',
    ],
    required,
  })
}

const forms = {
  browser: {
    local: {
      add: getLocalForm([
        'name',
      ]),
      edit: getLocalForm([
        'name',
      ]),
    },
    remote: {
      add: getRemoteForm([
        'name',
        'apiServer',
        'token',
        'ca',
      ]),
      edit: getRemoteForm([
        'name',
        'apiServer',
      ]),
    }
  },
  server: {
    local: {
      add: getLocalForm([
        'name',
      ]),
      edit: getLocalForm([]),
    },
    remote: {
      add: getRemoteForm([
        'name',
        'apiServer',
        'token',
        'ca',
      ]),
      edit: getRemoteForm([]),
    },
  },
}

module.exports = forms