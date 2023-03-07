/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const FileSecretStoreTest = require('./file_secret_store_test')
const { ClusterSecretStore } = require('../../src/store/clustersecret')

FileSecretStoreTest({
  GetStore: ClusterSecretStore,
  title: 'clustersecret',
})
