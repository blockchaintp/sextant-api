/* eslint-disable camelcase */
/*
 * Copyright © 2021 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import memoize = require('memoizee')
import { getLogger } from '../logging'
import { Deployment } from '../store/model/model-types'
import { getChartInfo, getChartName, getChartVersion } from '../tasks/deployment/utils/helmUtils'
import { getField as getFieldOriginal } from './getField'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/deploymentNames',
})

const getField = memoize(getFieldOriginal, { maxAge: 10000 })

function hasProperty(obj: object, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop) as boolean
}

export const getBestNamespace = memoize(
  (deployment: Deployment): string => {
    if (deployment.applied_state) {
      const applied_state = deployment.applied_state as object
      if (hasProperty(applied_state, 'namespace')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return applied_state['namespace']
      }
    }
    if (deployment.desired_state) {
      const desired_state = deployment.desired_state as object
      if (hasProperty(desired_state, 'namespace')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return deployment.desired_state.namespace as string
      }
    }
    const { deployment_type, deployment_version, applied_state, desired_state } = deployment

    if (applied_state) {
      const applied_namespace = getField({
        deployment_type,
        deployment_version,
        data: applied_state as object,
        field: 'namespace',
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.debug(
        {
          fn: 'getBestNamespace',
          deployment_type,
          deployment_version,
          applied_namespace,
        },
        'Deployment specified namespace via a field path'
      )
      if (applied_namespace) {
        return applied_namespace
      }
    }
    return getField({
      deployment_type,
      deployment_version,
      data: desired_state as object,
      field: 'namespace',
    })
  },
  { maxAge: 60000 }
)

export type HelmRelease = {
  chart: string
  name: string
  namespace: string
}
/**
 * Given a helm release status object translate that into an object that
 * __resembles__ a sextant deployment object.
 * @param {*} release the helm release status object
 */
export const helmReleaseToDeployment = memoize(
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
export const deploymentToHelmRelease = memoize(
  (deployment: Deployment) => {
    const { deployment_type, deployment_version, name } = deployment
    const chartInfo = getChartInfo(deployment_type, deployment_version)
    const chartVersion = getChartVersion(deployment_type, deployment_version)
    const chartName = getChartName(chartInfo)
    const chart = `${chartName}-${chartVersion}`
    const { extension } = chartInfo

    const releaseName = `${name}-${extension}`

    const release: HelmRelease = {
      name: releaseName,
      namespace: getBestNamespace(deployment),
      chart,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({
      fn: 'deploymentToHelmRelease',
      deployment_type,
      deployment_version,
      deployment_name: name,
      release,
    })
    return release
  },
  { maxAge: 60000 }
)

export const getChartNameForDeployment = memoize(
  (deployment: Deployment) => {
    const chartInfo = getChartInfo(deployment.deployment_type, deployment.deployment_version)
    return getChartName(chartInfo)
  },
  { maxAge: 60000 }
)

export const deploymentReleaseFullName = memoize(
  (deployment: Deployment) => {
    const { name } = deploymentToHelmRelease(deployment)
    const chartName = getChartNameForDeployment(deployment)
    return `${name}-${chartName}`
  },
  { maxAge: 60000 }
)
