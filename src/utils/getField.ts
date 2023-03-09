/* eslint-disable camelcase */
// extract a value from the desired_state of a deployment
// based on the paths - this means different deployment
// templates can choose their own fields for name and namespace
// and the deployment templates can get to those values in a
// unified way

import { get } from 'dotty'
import * as templateLoader from '../deployment_templates/templateLoader'
import { ChartBundleName, ChartVersion } from '../edition-type'
import { getLogger } from '../logging'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/getField',
})

export function getField({
  deployment_type,
  deployment_version,
  data,
  field,
}: {
  data: object
  deployment_type: ChartBundleName
  deployment_version: ChartVersion
  field: 'name' | 'namespace'
}) {
  const deploymentTypes = templateLoader.getHelmDeploymentDetails()
  const type = deploymentTypes[deployment_type]
  if (!type) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({ deployment_type, deploymentTypes }, 'no deployment type')
    throw new Error(`unknown deployment_type ${deployment_type}`)
  }
  const paths = type.paths[deployment_version]
  if (!paths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({ deployment_version, paths: type.paths }, 'no deployment_version')
    throw new Error(`unknown deployment version ${deployment_type} ${deployment_version}`)
  }
  const path = paths[field]
  if (!path) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.trace({ field, paths }, 'no field')
    throw new Error(`unknown deployment field ${deployment_type} ${deployment_version} ${field}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return get(data, path) as string
}
