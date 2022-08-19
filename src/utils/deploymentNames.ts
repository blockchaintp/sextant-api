/*
 * Copyright © 2021 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import memoize from 'memoizee'
import Logging from '../logging'
import realGetField from './getField'
import { getChartName, getChartInfo, getChartVersion } from '../tasks/deployment/utils/helmUtils'

const logger = Logging.getLogger({
  name: 'utils/deploymentNames',
})
const getField = memoize(realGetField, { maxAge: 10000 })

type Deployment = {
  deployment_type: string
  deployment_version: string
  desired_state: {
    [key: string]: any
  }
  applied_state: {
    [key: string]: any
  }
  namespace: string
  name: string
}

const getBestNamespace = memoize(
  (deployment: Partial<Deployment>) => {
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
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
      applied_state: appliedState,
      desired_state: desiredState,
    } = deployment

    if (appliedState) {
      logger.warn(
        {
          fn: 'getBestNamespace',
          deployment_type: deploymentType,
          deployment_version: deploymentVersion,
        },
        'Deployment specified namespace via a field path'
      )
      const appliedNamespace = getField({
        deployment_type: deploymentType,
        deployment_version: deploymentVersion,
        data: appliedState,
        field: 'namespace',
      })
      if (appliedNamespace) {
        return appliedNamespace
      }
    }
    return getField({
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
      data: desiredState,
      field: 'namespace',
    })
  },
  { maxAge: 60000 }
)

type HelmRelease = {
  name: string
  namespace: string
  chart: string
}
/**
 * Given a helm release status object translate that into an object that
 * __resembles__ a sextant deployment object.
 * @param {*} release the helm release status object
 */
const helmReleaseToDeployment = memoize(
  (release: HelmRelease) => {
    const { name, namespace, chart } = release

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
  },
  { maxAge: 60000 }
)

/**
 * Given sextant deployment object translate that into an object that
 * __resembles__ a helm release status object.
 * @param {*} deployment a sextant deployment object
 */
type MinimalDeploymentToReleaseArgs = Pick<Deployment, 'deployment_type' | 'deployment_version'> &
  Omit<Partial<Deployment>, 'deployment_type' | 'deployment_version'>

const deploymentToHelmRelease = memoize(
  (deployment: MinimalDeploymentToReleaseArgs): HelmRelease => {
    const { deployment_type: deploymentType, deployment_version: deploymentVersion, name } = deployment
    const chartInfo = getChartInfo(deploymentType, deploymentVersion)
    const chartVersion = getChartVersion(deploymentType, deploymentVersion)
    const chartName = getChartName(chartInfo)
    const chart = `${chartName}-${chartVersion}`
    const { extension } = chartInfo

    const releaseName = `${name}-${extension}`

    const release = {
      name: releaseName,
      namespace: getBestNamespace(deployment),
      chart,
    }

    logger.trace({
      fn: 'deploymentToHelmRelease',
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
      deployment_name: name,
      release,
    })
    return release
  },
  { maxAge: 60000 }
)

const getChartNameForDeployment = memoize(
  (deployment: Deployment) => {
    const chartInfo = getChartInfo(deployment.deployment_type, deployment.deployment_version)
    return getChartName(chartInfo)
  },
  { maxAge: 60000 }
)

const deploymentReleaseFullName = memoize(
  (deployment: Deployment) => {
    const { name } = deploymentToHelmRelease(deployment)
    const chartName = getChartNameForDeployment(deployment)
    return `${name}-${chartName}`
  },
  { maxAge: 60000 }
)

export default {
  helmReleaseToDeployment,
  deploymentToHelmRelease,
  deploymentReleaseFullName,
  getChartNameForDeployment,
}
