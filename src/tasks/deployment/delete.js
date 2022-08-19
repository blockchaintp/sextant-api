/* eslint-disable import/order */
const ClusterKubectl = require('../../utils/clusterKubectl').default
const renderTemplates = require('../../deployment_templates/render')
const deploymentNames = require('../../utils/deploymentNames')
const { getChartInfo } = require('./utils/helmUtils')

const { CLUSTER_STATUS } = require('../../config')

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

    const {
      deployment_method: deploymentMethod,
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
      desired_state: desiredState,
      applied_state: appliedState,
      custom_yaml: customYaml,
      status,
    } = deployment

    // if the deployment is in error state - use the
    // desired state to pick the namespace as it might
    // not have any applied_state having errored
    const useData = status === CLUSTER_STATUS.error ? desiredState : appliedState

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

    // delete helm chartsFolder
    // list all of the charts
    // helm list -n <namespace> -q
    // uninstall the charts listed
    // helm uninstall -n <namespace>

    const deleteHelmChartsInNamespace = async () => {
      try {
        const chartOut = await clusterKubectl.helmCommand(`list -n ${namespace} -q`)
        // re-format the return of list - it is probably a string with "\n' separators
        const chartList = chartOut.replace(/\n/g, ' ').split(' ')
        logger.info({
          fn: 'deleteHelmChartsInNamespace',
          chartList,
        })

        chartList.forEach(async (chart) => {
          if (chart) {
            logger.info(
              {
                fn: 'deleteHelmChartsInNamespace',
                chart,
                namespace,
              },
              'removing chart'
            )
            await clusterKubectl.helmCommand(`uninstall -n ${namespace} ${chart}`)
          }
        })
      } catch (err) {
        logger.warn({
          fn: 'deleteHelmChartsInNamespace',
          message: 'benign if there are no helm charts to delete',
          err,
        })
      }
    }

    const deleteHelmChart = async (chartInfo, installationName, namespaceName) => {
      logger.info(
        {
          fn: 'deleteHelmChart',
        },
        `deleting chart ${installationName} in namespace ${namespaceName}`
      )
      await clusterKubectl.helmCommand(`uninstall -n ${namespaceName} ${installationName}`)
    }

    if (deploymentMethod === 'helm') {
      const chartInfo = yield getChartInfo(deploymentType, deploymentVersion)
      yield deleteHelmChart(chartInfo, name, namespace)
    } else {
      // function expects arg named desired_state,
      // but we will use applied_state if there is no error status
      // because we are deleting not creating
      const templateDirectory = yield renderTemplates({
        deployment_type: deploymentType,
        deployment_version: deploymentVersion,
        desired_state: useData,
        custom_yaml: customYaml,
      })

      const deleteDirectory = async () => {
        try {
          await clusterKubectl.command(`delete -f ${templateDirectory}`)
        } catch (err) {
          // read the error, if it's NOT a server error - then throw an error
          // status will be set to error
          // otherwise ignore the error and let the status be set to delete
          const match =
            err.message.match(/Unable to connect to the server/g) ||
            err.message.match(/Error from server \(NotFound\): namespaces/g)
          if (match === null) {
            throw err
          }
        }
      }

      yield deleteDirectory()
      yield deleteHelmChartsInNamespace()
    }

    yield deleteTheRest()
  }

module.exports = DeploymentDelete
