/*
 * Copyright © 2021 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const helmUtils = require('../tasks/deployment/utils/helmUtils')
const logger = require('../logging').getLogger({
  name: 'utils/deploymentNames',
})

/**
 * Given a helm release status object translate that into an object that
 * __resembles__ a sextant deployment object.
 * @param {*} release the helm release status object
 */
const helmReleaseToDeployment = (release) => {
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
}

/**
 * Given sextant deployment object translate that into an object that
 * __resembles__ a helm release status object.
 * @param {*} deployment a sextant deployment object
 */
const deploymentToHelmRelease = (deployment) => {
  const chartInfo = helmUtils.getChartInfo(deployment.deployment_type, deployment.deployment_version)
  const chartVersion = helmUtils.getChartVersion(deployment.deployment_type, deployment.deployment_version)
  const chartName = helmUtils.getChartName(chartInfo)
  const chart = `${chartName}-${chartVersion}`
  const {
    extension,
    namespace,
  } = chartInfo
  const releaseName = `${deployment.name}-${extension}`

  const release = {
    name: releaseName,
    namespace,
    chart,
  }
  logger.trace({ fn: 'deploymentToHelmRelease', deployment, release })
  return release
}

module.exports = {
  helmReleaseToDeployment,
  deploymentToHelmRelease,
}
