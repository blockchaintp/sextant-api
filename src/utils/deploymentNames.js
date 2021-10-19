/*
 * Copyright © 2021 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const memoize = require('memoizee');
const helmUtils = require('../tasks/deployment/utils/helmUtils')
const logger = require('../logging').getLogger({
  name: 'utils/deploymentNames',
})
const getField = memoize(require('./getField'), { maxAge: 10000 })

const getBestNamespace = memoize((deployment) => {
  if (deployment.namespace) {
    return deployment.namespace
  }
  if (deployment.applied_state && deployment.applied_state.namespace) {
    return deployment.applied_state.namespace
  }
  if (deployment.desired_state && deployment.desired_state.namespace) {
    return deployment.desired_state.namespace
  }
  const {
    deployment_type,
    deployment_version,
    applied_state,
    desired_state,
  } = deployment

  if (applied_state) {
    logger.warn({
      fn: 'getBestNamespace',
      deployment_type,
      deployment_version,
    }, 'Deployment specified namespace via a field path')
    const applied_namespace = getField({
      deployment_type,
      deployment_version,
      data: applied_state,
      field: 'namespace',
    })
    if (applied_namespace) {
      return applied_namespace
    }
  }
  return getField({
    deployment_type,
    deployment_version,
    data: desired_state,
    field: 'namespace',
  })
}, { maxAge: 60000 })

/**
 * Given a helm release status object translate that into an object that
 * __resembles__ a sextant deployment object.
 * @param {*} release the helm release status object
 */
const helmReleaseToDeployment = memoize((release) => {
  const {
    name,
    namespace,
    chart,
  } = release

  const extension = name.split('-').slice(-1)[0] || ''
  const [chartName, chartVersion] = chart.split('-')

  const deployment = {
    deployment_name: name,
    deployment_type: chartName,
    deployment_version: chartVersion,
    extension,
    namespace,
  }
  logger.trace({ fn: 'helmReleaseToDeployment', deployment, release })
  return deployment
}, { maxAge: 60000 })

/**
 * Given sextant deployment object translate that into an object that
 * __resembles__ a helm release status object.
 * @param {*} deployment a sextant deployment object
 */
const deploymentToHelmRelease = memoize((deployment) => {
  const chartInfo = helmUtils.getChartInfo(deployment.deployment_type, deployment.deployment_version)
  const chartVersion = helmUtils.getChartVersion(deployment.deployment_type, deployment.deployment_version)
  const chartName = helmUtils.getChartName(chartInfo)
  const chart = `${chartName}-${chartVersion}`
  const {
    extension,
  } = chartInfo

  const releaseName = `${deployment.name}-${extension}`

  const release = {
    name: releaseName,
    namespace: getBestNamespace(deployment),
    chart,
  }
  logger.trace({ fn: 'deploymentToHelmRelease', deployment, release })
  return release
}, { maxAge: 60000 })

const getChartNameForDeployment = memoize((deployment) => {
  const chartInfo = helmUtils.getChartInfo(deployment.deployment_type, deployment.deployment_version)
  return helmUtils.getChartName(chartInfo)
}, { maxAge: 60000 })

module.exports = {
  helmReleaseToDeployment,
  deploymentToHelmRelease,
  getChartNameForDeployment,
}
