/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const FileSecretStoreTest = require('./file_secret_store_test')
const { ClusterFileStore } = require('../../src/store/clusterfile')

FileSecretStoreTest({
  GetStore: ClusterFileStore,
  title: 'clusterfile',
})
