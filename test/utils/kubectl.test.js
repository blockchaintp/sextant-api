const Kubectl = require('../../src/utils/kubectl').default
const asyncTest = require('../asyncTest')
const asyncTestError = require('../asyncTestError')

asyncTest('kubectl -> get help output', async (t) => {
  const kubectl = Kubectl({
    mode: 'test',
  })
  const stdout = await kubectl.command('help')

  t.ok(stdout.toLowerCase().indexOf('kubernetes') >= 0, 'the output contained the word Kubernetes')
})

asyncTestError('kubectl -> run bad command', async () => {
  const kubectl = Kubectl({
    mode: 'test',
  })
  await kubectl.command('oranges')
})
