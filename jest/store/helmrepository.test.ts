/* eslint-disable camelcase */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { HelmRepositoryStore } from '../../src/store/helmrepository'
import { setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('HelmRepositoryStore', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let helmRepoStore: HelmRepositoryStore
  beforeAll(async () => {
    testDb = await setupPostgresContainers()
    helmRepoStore = new HelmRepositoryStore(testDb.db)
  }, 300000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  }, 300000)

  it('should create a helm repository', async () => {
    const repo = await helmRepoStore.create({
      data: {
        name: 'test-repo',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    expect(repo).toMatchObject({
      name: 'test-repo',
    })
  }, 1200000)

  it('should delete a helm repository', async () => {
    const repo = await helmRepoStore.create({
      data: {
        name: 'test-repo-delete',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })

    const deletedRepo = await helmRepoStore.delete({ id: repo.id })

    expect(deletedRepo).toMatchObject({
      ...repo,
    })
  }, 1200000)

  it('should get a helm repository', async () => {
    const repo = await helmRepoStore.create({
      data: {
        name: 'test-repo-get',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    const getRepo = await helmRepoStore.get({ id: repo.id })
    expect(getRepo).toMatchObject({
      ...repo,
    })
  }, 1200000)

  it('should list all helm repositories', async () => {
    const repo = await helmRepoStore.create({
      data: {
        name: 'test-repo-list',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    await helmRepoStore.delete({ id: repo.id })

    const repos = await helmRepoStore.list()
    expect(repos.length).toBeGreaterThan(0)
  }, 1200000)

  it('should update a helm repo', async () => {
    const repo = await helmRepoStore.create({
      data: {
        name: 'test-repo-update',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    const updatedRepo = await helmRepoStore.update({
      id: repo.id,
      data: {
        name: 'test-repo-update',
        active: false,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    expect(updatedRepo).toMatchObject({
      ...repo,
      active: 'false',
    })
  }, 1200000)
})
