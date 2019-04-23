const clusterForms = {
  local: [{
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
  }],
  remote: [{
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
    id: 'connection',
    title: `Connection`,
    helperText: 'Enter the connection details for the cluster',
    component: 'textarea',
    validate: {
      type: 'string',
      methods: [
        ['required', 'The connection details are required'],
      ],
    }
  }]
}

module.exports = clusterForms