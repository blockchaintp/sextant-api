const FastStorageClass = ({ clusterSettings }) => {
  return `kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
    name: fast-keep
provisioner: kubernetes.io/aws-ebs
parameters:
  type: io1
  fsType: ext4
  iopsPerGB: "50" 
reclaimPolicy: Delete
`
}

const SlowStorageClass = ({ clusterSettings }) => {
  return `kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
    name: slow-keep
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
  fsType: ext4
reclaimPolicy: Delete
`
}

module.exports = {
  FastStorageClass,
  SlowStorageClass,
}