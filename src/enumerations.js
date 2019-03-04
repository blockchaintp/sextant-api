const ADMIN_ROLE = [
  'admin',
  'user',
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

const DEPLOYMENT_STATUS = [
  'created',
  'provisioned',
  'error',
]

const PERMISSION_ROLE = [
  'read',
  'write',
]

module.exports = {
  ADMIN_ROLE,
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS,
  DEPLOYMENT_STATUS,
  PERMISSION_ROLE,
}