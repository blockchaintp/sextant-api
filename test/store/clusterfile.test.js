/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const FileSecretStoreTest = require('./file_secret_store_test')
const ClusterFileStore = require('../../src/store/clusterfile')

FileSecretStoreTest({
  GetStore: ClusterFileStore,
  title: 'clusterfile',
})
