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

  it('Can add repositories', async () => {
    const tool = new HelmTool(edition, tmpDir)
    await tool.add()
  })

  it('can update repositories', async () => {
    const tool = new HelmTool(edition, tmpDir)
    await tool.update()
  }, 120000)

  it('can store charts locally', async () => {
    const tool = new HelmTool(edition, tmpDir)
    await tool.storeChartsLocally()
  }, 120000)
})
