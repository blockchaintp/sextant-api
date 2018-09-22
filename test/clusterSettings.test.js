'use strict'

const tape = require('tape')
const clusterUtils = require('../src/utils/cluster')
const clusterSettings = require('./fixtures/clusterSettings.json')
const kopsValuesFixture = require('./fixtures/kopsValues.json')

tape('test cluster settings -> kops values', (t) => {
  const kopsValues = clusterUtils.getKopsValues(clusterSettings)
  t.deepEqual(kopsValues, kopsValuesFixture, `the kops values are correct`)
  t.end()
})