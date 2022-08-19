const FileSecretStoreTest = require('./file_secret_store_test')
const ClusterSecretStore = require('../../src/store/clustersecret').default

FileSecretStoreTest({
  GetStore: ClusterSecretStore,
  title: 'clustersecret',
})
