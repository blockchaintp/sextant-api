/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Knex } from 'knex'
import { StartedTestContainer } from 'testcontainers'
import { K8S_CREDENTIALS_SECRET_NAME } from '../../src/constants'
import { ClusterController } from '../../src/controller/cluster'
import { ClusterAddUserForm } from '../../src/forms/schema/cluster'
import { Store } from '../../src/store'
import { decode } from '../../src/utils/base64'
import { makeAUser, setupPostgresContainers, tearDownPostgresContainers } from '../common'

describe('ClusterController', () => {
  let testDb: {
    db: Knex
    pgContainer: StartedTestContainer
  }
  let store: Store
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

    const data: ClusterAddUserForm = {
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

    const retData = await controller.createUserPT({
      user,
      data,
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
        ...data.cluster,
      },
      user: {
        ...data.user,
      },
    })
  })
})
