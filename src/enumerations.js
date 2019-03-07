const RESOURCE_TYPES = [
  'cluster',
  'deployment',
]

const CLUSTER_PROVISION_TYPE = [
  'aws_ec2',
  'aws_eks',
  'google_gcp',
  'google_gke',
  'azure_compute',
  'azure_aks',
  'byok',
]

const CLUSTER_STATUS = [
  'created',
  'provisioned',
  'error',
]

const CLUSTER_STATUS_DEFAULT = 'created'

const DEPLOYMENT_STATUS = [
  'created',
  'provisioned',
  'error',
]

const DEPLOYMENT_STATUS_DEFAULT = 'created'

const PERMISSION_ROLE = [
  'admin',
  'read',
  'write',
]

const TASK_STATUS = [
  'created',
  'running',
  'finished',
  'cancelling',
  'cancelled',
  'error',
]

module.exports = {
  RESOURCE_TYPES,
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS,
  CLUSTER_STATUS_DEFAULT,
  DEPLOYMENT_STATUS,
  DEPLOYMENT_STATUS_DEFAULT,
  PERMISSION_ROLE,
  TASK_STATUS,
}