/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { K8S_CREDENTIALS_SECRET_NAME } from '../../src/constants'
import { ClusterController } from '../../src/controller/cluster'
import { ClusterAddUserForm, ClusterEditUserForm } from '../../src/forms/schema/cluster'
import { Store } from '../../src/store'
import { decode } from '../../src/utils/base64'
import { makeAUser, setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('ClusterController', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let store: Store

  const INITIAL_CLUSTER_FORM: ClusterAddUserForm = {
    provision_type: 'user',
    cluster: {
      name: 'userauthcluster',
      server: 'https://localhost:8080',
      skipTLSVerify: true,
    },
    user: {
      name: 'userauthuser',
    },
  }

  beforeAll(async () => {
    testDb = await setupPostgresContainers(5433)
    store = new Store(testDb.db)
  }, 300000)

  afterAll(async () => {
    await tearDownPostgresContainers(testDb)
  })

  it('createUserPT', async () => {
    const controller = ClusterController({ store })
    const user = await makeAUser(store, `createUserPT-user`)

    const retData = await controller.createUserPT({
      user,
      data: INITIAL_CLUSTER_FORM,
    })
    expect(retData).toBeDefined()
    expect(retData).toMatchObject({
      action: 'cluster.create',
      status: 'created',
    })

    const secret = await store.clustersecret.get({
      cluster: 1, // probably not the right way to do this
      name: K8S_CREDENTIALS_SECRET_NAME,
    })
    expect(secret).toBeDefined()
    expect(secret?.base64data).toBeDefined()
    const decoded = decode(secret!.base64data)
    const parsed = JSON.parse(decoded.toString())
    expect(parsed).toMatchObject({
      cluster: {
        ...INITIAL_CLUSTER_FORM.cluster,
      },
      user: {
        ...INITIAL_CLUSTER_FORM.user,
      },
    })
  })

  it('updateUserPT', async () => {
    const controller = ClusterController({ store })
    const user = await makeAUser(store, `updateUserPT-user`)

    const editForm: ClusterEditUserForm = {
      provision_type: 'user',
      cluster: {
        name: 'userauthcluster-updated',
        skipTLSVerify: false,
      },
      user: {},
    }
    try {
      await controller.updateUserPT({ id: 1, user, data: editForm })
      fail('should have thrown an exception since there are active tasks')
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(err.message).toBeDefined()
    }
    await store.task.deleteForResource({ resource_type: 'cluster', resource_id: 1 })

    const retTask = await controller.updateUserPT({ id: 1, user, data: editForm })
    expect(retTask).toBeDefined()
    expect(retTask).toMatchObject({
      action: 'cluster.update',
      status: 'created',
    })

    const secret = await store.clustersecret.get({
      cluster: 1, // probably not the right way to do this
      name: K8S_CREDENTIALS_SECRET_NAME,
    })
    expect(secret).toBeDefined()
    expect(secret?.base64data).toBeDefined()
    const decoded = decode(secret!.base64data)
    const parsed = JSON.parse(decoded.toString())
    expect(parsed).toMatchObject({
      cluster: {
        ...INITIAL_CLUSTER_FORM.cluster,
        ...editForm.cluster,
      },
      user: {
        ...INITIAL_CLUSTER_FORM.user,
        ...editForm.user,
      },
    })
  })

  it('delete', async () => {
    const controller = ClusterController({ store })
    const user = await makeAUser(store, `delete-user`)

    try {
      await controller.delete({ id: 1, user })
      fail('should have thrown an exception since there are active tasks')
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(err.message).toBeDefined()
    }
    await store.task.deleteForResource({ resource_type: 'cluster', resource_id: 1 })

    const retTask = await controller.delete({ id: 1, user })
    expect(retTask).toBeDefined()
    expect(retTask).toMatchObject({
      action: 'cluster.delete',
      status: 'created',
    })
  })

  it('deletePermanently', async () => {
    const controller = ClusterController({ store })
    const user = await makeAUser(store, `deletePermanently-user`)

    try {
      await controller.deletePermanently({ id: 1, user })
      fail('should have thrown an exception since there are active tasks')
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(err.message).toBeDefined()
    }
    await store.task.deleteForResource({ resource_type: 'cluster', resource_id: 1 })

    try {
      await controller.deletePermanently({ id: 1, user })
      fail('should have thrown an exception since cluster is not deleted')
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(err.message).toBeDefined()
    }
    await store.cluster.update({ id: 1, data: { status: 'deleted' } })
    const retTask = await controller.deletePermanently({ id: 1, user })
    expect(retTask).toBeDefined()
    expect(retTask).toEqual(true)
  })
})
