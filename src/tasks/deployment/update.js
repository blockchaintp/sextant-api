/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
/*
 * Copyright © 2023 Paravela Limited All Rights Reserved
 *
 * License: Product
 */
const { Kubectl } = require('../../utils/kubectl')
const deploymentNames = require('../../utils/deploymentNames')
const { saveAppliedState } = require('./utils/saveAppliedState')
const { writeValues } = require('../../deployment_templates/writeValues')
const { getChartInfo, getChartVersion } = require('./utils/helmUtils')
const KeyPair = require('../../utils/sextantKeyPair')

const DeploymentUpdate = ({ testMode }) =>
  function* deploymentUpdateTask(params) {
    const { store, task, trx } = params

    const id = task.resource_id

    const deployment = yield store.deployment.get(
      {
        id,
      },
      trx
    )

    KeyPair.getOrCreate({ store, deployment: deployment.id }, trx)

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
      `-n ${namespace} upgrade --create-namespace ${installationName} -f ${valuesPath} ${useChart} --install --version ${chartversion}`
    )

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = DeploymentUpdate
