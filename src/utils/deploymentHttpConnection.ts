/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import axios, { AxiosInstance } from 'axios'
import { Agent } from 'https'
import deploymentConnection, { DeploymentConnection, DeploymentConnectionArgs } from './deploymentConnection'

type DeploymentHttpConnectionArgs = DeploymentConnectionArgs

export type DeploymentHttpConnection = DeploymentConnection & {
  client: AxiosInstance
}
const deploymentHttpConnection = async ({ store, id, connectionCacheId }: DeploymentHttpConnectionArgs) => {
  const connection = await deploymentConnection({
    store,
    id,
    connectionCacheId,
  })

  const httpsAgent = new Agent({
    ca: connection.ca,
  })

  const client = axios.create({
    headers: {
      Authorization: `Bearer ${connection.token}`,
    },
    httpsAgent,
  })

  const httpConnection: DeploymentHttpConnection = {
    ...connection,
    client,
  }
  return httpConnection
}

export default deploymentHttpConnection
