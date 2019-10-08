const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')
const getField = require('../../deployment_templates/getField')

const {
  CLUSTER_STATUS,
} = require('../../config')

const DeploymentDelete = ({
  testMode,
}) => function* deploymentCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  const deployment = yield store.deployment.get({
    id,
  }, trx)

  const cluster = yield store.cluster.get({
    id: deployment.cluster,
  }, trx)

  if(testMode) {
    return
  }

  const {
    deployment_type,
    deployment_version,
    desired_state,
    applied_state,
    status,
  } = deployment

  // if the deployment is in error state - use the
  // desired state to pick the namespace as it might
  // not have any applied_state having errored
  const useData = status == CLUSTER_STATUS.error ?
    desired_state :
    applied_state

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: useData,
    field: 'namespace',
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  const interceptError = async () => {
    try {
      // try to connect to a remote cluster and delete it
      await clusterKubectl.command(`delete all --all -n ${namespace}`)
      await clusterKubectl.command(`delete configmap validator-public -n ${namespace} || true`)
      // delete stacks if they are there
      await clusterKubectl.command(`delete stacks --all -n ${namespace} || true`)
    } catch (err) {
      // read the error, if it's NOT a server error - then throw an error
      // status will be set to error
      // otherwise ignore the error and let the status be set to delete
      const match = err.message.match(/Unable to connect to the server/g) || err.message.match(/Error from server \(NotFound\): namespaces/g)
      if (match === null) {
        throw err
      }
    }
  }

  yield interceptError()

  // delete helm chartsFolder
  // list all of the charts
  // helm list -n <namespace> -q
  // uninstall the charts listed
  // helm uninstall -n <namespace>

  const deleteHelmCharts = async () => {
    try {
      const chartList = await clusterKubectl.helmCommand(`list -n ${namespace} -q`)
      // re-format the return of list - it is probably a string with "\n' seperators

      chartList.forEach( async (chart) => {
        await clusterKubectl.helmCommand(`uninstall -n ${namespace} -q ${chart}`)
      })
    } catch(err) {
      console.log("------------\n-------------\n You probably don't have any helm charts to delete\n");
      console.log(err);
      console.log("------------\n-------------\n");
    }
  }

  yield deleteHelmCharts()

}

module.exports = DeploymentDelete
