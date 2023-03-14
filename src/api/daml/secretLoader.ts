/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { Store } from '../../store'
import { DatabaseIdentifier } from '../../store/model/scalar-types'
import { ClusterKubectl } from '../../utils/clusterKubectl'
import * as deploymentNames from '../../utils/deploymentNames'

export class SecretLoader {
  private id: DatabaseIdentifier
  private store: Store

  constructor({ store, id }: { id: DatabaseIdentifier; store: Store }) {
    this.store = store
    this.id = id
  }

  public async getSecret(name: string) {
    const deployment = await this.store.deployment.get({
      id: this.id,
    })

    const cluster = await this.store.cluster.get({
      id: deployment.cluster,
    })

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store: this.store,
    })
    return clusterKubectl.getSecretByName(namespace, name)
  }
}
