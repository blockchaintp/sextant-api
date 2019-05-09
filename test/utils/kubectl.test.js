'use strict'

const Kubectl = require('../../src/utils/kubectl')
const asyncTest = require('../asyncTest')

asyncTest('kubectl -> get help output', async (t) => {

  const kubectl = Kubectl()
  const [ stdout, stderr ] = await kubectl.command(`help`)

  t.ok(stdout.toLowerCase().indexOf('kubernetes') >= 0, `the output contained the word Kubernetes`)
})
