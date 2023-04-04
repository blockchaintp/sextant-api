/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { Kubectl } from '../../utils/kubectl'
import * as deploymentNames from '../../utils/deploymentNames'
import { saveAppliedState } from './utils/saveAppliedState'
import { writeValues } from '../../deployment_templates/writeValues'
import { getChartInfo, getChartVersion } from './utils/helmUtils'
import * as KeyPair from '../../utils/sextantKeyPair'
import { Knex } from 'knex'
import { Store } from '../../store'
import * as model from '../../store/model/model-types'

type Options = {
  testMode: boolean
}

export const DeploymentUpdate = ({ testMode }: Options) =>
  function* deploymentUpdateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
    const { store, task, trx } = params

    const id = task.resource_id

    const deployment = yield store.deployment.get(
      {
        id,
      },
      trx
    )
    // this should be awaited - but the yield is required for the generator function
    yield KeyPair.getOrCreate({ store, deployment: deployment.id }, trx)

    const cluster = yield store.cluster.get(
      {
        id: deployment.cluster,
      },
      trx
    )

    const { deployment_type, deployment_version, desired_state, custom_yaml } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { name, namespace } = modelRelease

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })

      return
    }

    const clusterKubectl = yield Kubectl.getKubectlForCluster({
      cluster,
      store,
    })

    /*
  use the helm chart to update the deployment on the cluster
  otherwise, use the template directory
  */

    const chartInfo = yield getChartInfo(deployment_type, deployment_version)
    const chartversion = yield getChartVersion(deployment_type, deployment_version)

    const { chart } = chartInfo
    const installationName = `${name}`
    const valuesPath = yield writeValues({ desired_state, custom_yaml })

    const useChart = process.env.USE_LOCAL_CHARTS ? `/app/api/helmCharts/${chart.split('/')[1]}` : chart

    // if the chart is installed, upgrade it. Otherwise, install it
    yield clusterKubectl.helmCommand(
      // eslint-disable-next-line max-len
      `-n ${namespace} upgrade --create-namespace ${installationName} -f ${valuesPath} ${useChart} --install --version ${chartversion}`
    )

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = DeploymentUpdate
