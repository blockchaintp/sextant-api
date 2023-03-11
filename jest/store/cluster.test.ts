/* eslint-disable camelcase */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { ClusterStore } from '../../src/store/cluster'
import { setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('ClusterStore', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let clusterStore: ClusterStore
  beforeAll(async () => {
    testDb = await setupPostgresContainers()
    clusterStore = new ClusterStore(testDb.db)
  }, 300000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  })

  it('should create a cluster', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    expect(cluster).toMatchObject({
      id: 1,
      name: 'test-cluster',
      provision_type: 'remote',
      desired_state: { state: 'running' },
      status: 'created',
      capabilities: {},
    })
  })

  it('should delete a cluster', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-delete-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    const deletedCluster = await clusterStore.delete({ id: cluster.id })

    expect(deletedCluster).toMatchObject({
      ...cluster,
      status: 'deleted',
    })
  })

  it('should delete a cluster permanently', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-delete-permanently-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    const deletedCluster = await clusterStore.deletePermanently({ id: cluster.id })
    expect(deletedCluster).toMatchObject({
      ...cluster,
    })
  })

  it('should get a cluster', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-delete-permanently-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    const getCluster = await clusterStore.get({ id: cluster.id })
    expect(getCluster).toMatchObject({
      ...cluster,
    })
  })

  it('should list all clusters', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-list-all-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    await clusterStore.delete({ id: cluster.id })

    const clusters = await clusterStore.list({ deleted: false })
    expect(clusters.length).toBeGreaterThan(0)

    const clustersWithDeleted = await clusterStore.list({ deleted: true })
    expect(clustersWithDeleted.length).toBeGreaterThan(clusters.length)
  })

  it('should update a cluster', async () => {
    const cluster = await clusterStore.create({
      data: {
        name: 'test-update-cluster',
        provision_type: 'remote',
        desired_state: { state: 'running' },
        status: 'created',
        capabilities: {},
      },
    })
    const updatedCluster = await clusterStore.update({
      id: cluster.id,
      data: {
        name: 'test-update-cluster',
        provision_type: 'remote',
        desired_state: { state: 'updated' },
        status: 'created',
        capabilities: {},
      },
    })
    expect(updatedCluster).toMatchObject({
      ...cluster,
      desired_state: { state: 'updated' },
    })
  })
})
