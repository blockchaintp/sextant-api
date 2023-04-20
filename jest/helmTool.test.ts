import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { edition } from '../src/edition'
import { HelmTool } from '../src/helmTool'
import * as fsExtra from 'fs-extra'
import { tmpNameSync } from 'tmp'
import { Store } from '../src/store'
import { setupPostgresContainers, tearDownPostgresContainers } from './common'
import { HelmRepositoryStore } from '../src/store/helmrepository'
import { badEdition } from '../test/bad-edition'
describe('helmTool', () => {
  let tmpDir: string
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let store: Store
  let helmRepoStore: HelmRepositoryStore

  beforeAll(async () => {
    tmpDir = tmpNameSync({
      prefix: 'helmToolTest',
    })
    fsExtra.mkdirSync(tmpDir)
    testDb = await setupPostgresContainers()
    store = new Store(testDb.db)
    helmRepoStore = new HelmRepositoryStore(testDb.db)
  }, 300000)

  afterAll(async () => {
    fsExtra.removeSync(tmpDir)
    await tearDownPostgresContainers(testDb)
  }, 30000)

  it('can start', async () => {
    const tool = new HelmTool(edition, store, tmpDir)
    await tool.start()
  }, 1200000)

  it('can start with an existing helm repo and update it', async () => {
    const tool = new HelmTool(edition, store, tmpDir)
    await helmRepoStore.update({
      id: 1,
      data: {
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    await tool.start()
  }, 1200000)

  it('should not start', async () => {
    try {
      const tool = new HelmTool(badEdition, store, tmpDir)
      await tool.start()
      fail('should have thrown')
    } catch (err) {
      expect(err).toBeDefined()
    }
  }, 1200000)

  it('can accept username and password', () => {
    const tool = new HelmTool(edition, store, tmpDir)
    const cmd = tool.buildCommand({
      name: 'test',
      password: 'test',
      url: 'https://example.com',
      username: 'test',
    })
    expect(cmd).toEqual('helm repo add --force-update test https://example.com --username test --password test')
  })
})
