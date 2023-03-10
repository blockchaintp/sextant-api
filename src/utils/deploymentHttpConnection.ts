/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import * as https from 'https'
import * as axios from 'axios'
import { deploymentConnection, CachedConnection } from './deploymentConnection'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { Store } from '../store'

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

  return { ...connection, client }
}
