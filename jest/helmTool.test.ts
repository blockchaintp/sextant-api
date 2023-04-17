import { edition } from '../src/edition'
import { HelmTool } from '../src/helmTool'
import * as fsExtra from 'fs-extra'
import { tmpNameSync } from 'tmp'
describe('helmTool', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = tmpNameSync({
      prefix: 'helmToolTest',
    })
    fsExtra.mkdirSync(tmpDir)
  })

  afterAll(() => {
    fsExtra.removeSync(tmpDir)
  })

  it('can start', async () => {
    const tool = new HelmTool(edition, tmpDir)
    await tool.start()
  }, 1200000)
})
