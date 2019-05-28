const form = [
  [
    {
      id: 'namespace',
      title: `Namespace`,
      helperText: 'The Kubernetes namespace',
      component: 'text',
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', `^[a-zA-Z0-9]+$`, 'Only alphanumeric characters']
        ],
      },
    },
  ],
]

module.exports = form