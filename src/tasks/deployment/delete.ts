import { Kubectl } from '../../utils/kubectl'
import * as deploymentNames from '../../utils/deploymentNames'
import { getLogger } from '../../logging'
import { Knex } from 'knex'
import { Store } from '../../store'
import * as model from '../../store/model/model-types'

const logger = getLogger({
  name: 'tasks/deployment/delete',
})

const DeploymentDelete = ({ testMode }) =>
  function* deploymentCreateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
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

    const clusterKubectl = yield Kubectl.getKubectlForCluster({
      cluster,
      store,
    })

    const deleteTheRest = async () => {
      try {
        await clusterKubectl.deleteConfigMap(namespace, 'validator-public')
        // delete stacks if they are there
      } catch (err: Error) {
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
