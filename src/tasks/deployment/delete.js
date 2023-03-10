/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const ClusterKubectl = require('../../utils/clusterKubectl')
const deploymentNames = require('../../utils/deploymentNames')

const logger = require('../../logging').getLogger({
  name: 'tasks/deployment/delete',
})

const DeploymentDelete = ({ testMode }) =>
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

    if (testMode) {
      return
    }

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { name, namespace } = modelRelease

    const clusterKubectl = yield ClusterKubectl({
      cluster,
      store,
    })

    const deleteTheRest = async () => {
      try {
        await clusterKubectl.deleteConfigMap(namespace, 'validator-public')
        // delete stacks if they are there
      } catch (err) {
        let match = null
        if (err.response && err.response.statusCode === 404) {
          return
        }
        // read the error, if it's NOT a server error - then throw an error
        // status will be set to error
        // otherwise ignore the error and let the status be set to delete
        logger.trace({ fn: 'deleteTheRest', err }, 'error deleting configmap')
        match =
          err.message.match(/Unable to connect to the server/g) ||
          err.message.match(/Error from server \(NotFound\): namespaces/g)
        if (match === null) {
          throw err
        }
      }
    }

    const deleteHelmChart = async (installationName, namespaceName) => {
      logger.info(
        {
          fn: 'deleteHelmChart',
        },
        `deleting chart ${installationName} in namespace ${namespaceName}`
      )
      await clusterKubectl.helmCommand(`uninstall -n ${namespaceName} ${installationName}`)
    }

    yield deleteHelmChart(name, namespace)

    yield deleteTheRest()
  }

module.exports = DeploymentDelete
