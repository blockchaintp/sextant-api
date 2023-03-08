/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Kubectl } = require('../../src/utils/kubectl')
const asyncTest = require('../asyncTest')
const asyncTestError = require('../asyncTestError')

asyncTest('kubectl -> get help output', async (t) => {
  const kubectl = new Kubectl({
    mode: 'test',
  })
  const { stdout } = await kubectl.command('help')

  t.ok(stdout.toLowerCase().indexOf('kubernetes') >= 0, 'the output contained the word Kubernetes')
})

asyncTestError('kubectl -> run bad command', async () => {
  const kubectl = new Kubectl({
    mode: 'test',
  })
  await kubectl.command('oranges')
})
