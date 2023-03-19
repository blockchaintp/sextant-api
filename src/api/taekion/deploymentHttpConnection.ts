/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import * as axios from 'axios'
import * as https from 'https'
import { Store } from '../../store'
import { DatabaseIdentifier } from '../../store/model/scalar-types'
import { CachedConnection, deploymentConnection } from './deploymentConnection'

type CachedHttpConnection = CachedConnection & {
  client: axios.AxiosInstance
}

export const deploymentHttpConnection = async ({
  store,
  id,
  onConnection,
  connectionCacheId,
}: {
  connectionCacheId?: string
  id: DatabaseIdentifier
  onConnection?: (connection: CachedConnection) => Promise<void>
  store: Store
}) => {
  const connection = await deploymentConnection({
    store,
    id,
    onConnection,
    connectionCacheId,
  })

  const httpsAgent = new https.Agent({
    ca: connection.ca,
  })

  const client = axios.default.create({
    headers: {
      Authorization: `Bearer ${connection.token}`,
    },
    httpsAgent,
  })

  return { ...connection, client } as CachedHttpConnection
}
