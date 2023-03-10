/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const ClusterKubectl = require('../../utils/clusterKubectl')
const deploymentNames = require('../../utils/deploymentNames')
const saveAppliedState = require('./utils/saveAppliedState')
const KeyPair = require('../../utils/sextantKeyPair')
const { getChartInfo, getChartVersion } = require('./utils/helmUtils')
const { writeValues } = require('../../deployment_templates/writeValues')

const DeploymentCreate = ({ testMode }) =>
  function* deploymentCreateTask(params) {
    const { store, task, trx } = params

    const id = task.resource_id

    const deployment = yield store.deployment.get(
      {
        id,
      },
      trx
    )

    const cluster = yield store.cluster.get(
      {
        id: deployment.cluster,
      },
      trx
    )

    const keyPair = yield KeyPair.create(
      {
        store,
        deployment: deployment.id,
      },
      trx
    )

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })

      return
    }

    const { deployment_type, deployment_version, desired_state, custom_yaml } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { name, namespace } = modelRelease

    const clusterKubectl = yield ClusterKubectl({
      cluster,
      store,
    })

    // if the deploymentMethod is helm, use helm to create deployment, otherwise use the deployment templates directory
    const chartInfo = yield getChartInfo(deployment_type, deployment_version)
    const chartversion = yield getChartVersion(deployment_type, deployment_version)
    const { chart } = chartInfo
    const installationName = `${name}`
    const valuesPath = yield writeValues({ desired_state, custom_yaml })
    const useChart = process.env.USE_LOCAL_CHART ? process.env.USE_LOCAL_CHART : chart
    yield clusterKubectl.helmCommand(
      `-n ${namespace} install --create-namespace ${installationName}` +
        ` -f ${valuesPath} ${useChart} --version ${chartversion}`
    )

    // If the secret exists, continue. If not, create it.
    const secretsArray = yield clusterKubectl.getSecrets(namespace)
    const existingSecret = secretsArray.items.find((item) => item.metadata.name === 'sextant-public-key')
    if (!existingSecret)
      yield clusterKubectl.command(
        `-n ${namespace} create secret generic sextant-public-key --from-literal=publicKey=${keyPair.publicKey}`
      )

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = DeploymentCreate
