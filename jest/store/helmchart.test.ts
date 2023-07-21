/* eslint-disable camelcase */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { HelmChartStore } from '../../src/store/helmchart'
import { HelmRepositoryStore } from '../../src/store/helmrepository'
import { HelmRepository } from '../../src/store/model/model-types'
import { setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('HelmChartStore', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let store: HelmChartStore
  let repo: HelmRepository
  beforeAll(async () => {
    testDb = await setupPostgresContainers()
    const repoStore = new HelmRepositoryStore(testDb.db)
    repo = await repoStore.create({
      data: {
        name: 'test-repo',
        active: true,
        url: 'https://charts.bitnami.com/bitnami',
      },
    })
    store = new HelmChartStore(testDb.db)
  }, 1200000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  }, 1200000)

  it('should create a helm chart', async () => {
    const chart = await store.create({
      data: {
        active: true,
        name: 'test-chart',
        app_version: '1.0.0',
        description: 'test chart description',
        digest: 'test-digest',
        repository_id: repo.id,
        icon: 'https://example.com/icon.png',
        version: '1.0.0',
        keywords: ['test', 'chart'],
      },
    })
    expect(chart).toMatchObject({
      name: 'test-chart',
    })
  }, 1200000)

  it('should delete a helm chart', async () => {
    const chart = await store.create({
      data: {
        active: true,
        name: 'test-chart-delete',
        app_version: '1.0.0',
        description: 'test chart description',
        digest: 'test-digest',
        repository_id: repo.id,
        icon: 'https://example.com/icon.png',
        version: '1.0.0',
        keywords: ['test', 'chart'],
      },
    })

    const deletedChart = await store.delete({ id: chart.id })

    expect(deletedChart).toMatchObject({
      ...chart,
    })
  }, 1200000)

  it('should get a helm chart', async () => {
    const chart = await store.create({
      data: {
        active: true,
        name: 'test-chart-get',
        app_version: '1.0.0',
        description: 'test chart description',
        digest: 'test-digest',
        repository_id: repo.id,
        icon: 'https://example.com/icon.png',
        version: '1.0.0',
        keywords: ['test', 'chart'],
      },
    })
    const getChart = await store.get({ id: chart.id })
    expect(getChart).toMatchObject({
      ...chart,
    })
  }, 1200000)

  it('should list all helm charts', async () => {
    const chart = await store.create({
      data: {
        active: true,
        name: 'test-chart-list',
        app_version: '1.0.0',
        description: 'test chart description',
        digest: 'test-digest',
        repository_id: repo.id,
        icon: 'https://example.com/icon.png',
        version: '1.0.0',
        keywords: ['test', 'chart'],
      },
    })
    await store.delete({ id: chart.id })

    const charts = await store.list()
    expect(charts.length).toBeGreaterThan(0)
  }, 1200000)

  it('should update a helm repo', async () => {
    const chart = await store.create({
      data: {
        active: true,
        name: 'test-chart-update',
        app_version: '1.0.0',
        description: 'test chart description',
        digest: 'test-digest',
        repository_id: repo.id,
        icon: 'https://example.com/icon.png',
        version: '1.0.0',
        keywords: ['test', 'chart'],
      },
    })
    const updatedChart = await store.update({
      id: chart.id,
      data: {
        active: false,
      },
    })
    expect(updatedChart).toMatchObject({
      ...chart,
      active: false,
    })
  }, 1200000)
})
