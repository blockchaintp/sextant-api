const FileSecretStoreTest = require('./file_secret_store_test')
const ClusterFileStore = require('../../src/store/clusterfile').default

FileSecretStoreTest({
  GetStore: ClusterFileStore,
  title: 'clusterfile',
})
