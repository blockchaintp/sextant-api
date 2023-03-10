/* eslint-disable camelcase */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { ClusterStore } from '../../src/store/cluster'
import { setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('ClusterStore', () => {
  let testStore: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  beforeAll(async () => {
    testStore = await setupPostgresContainers()
  }, 300000)

  afterAll(async () => {
    await tearDownPostgresContainers(testStore)
  })

  it('should create a cluster', async () => {
    const clusterStore = new ClusterStore(testStore.db)
    const cluster = await clusterStore.create({
      data: {
        name: 'test-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
      },
    })
    expect(cluster).toMatchObject({
      name: 'test-cluster',
      provision_type: 'remote',
      desired_state: { state: 'running' },
    })
  })
})
