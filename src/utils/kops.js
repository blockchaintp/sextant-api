const exec = require('child_process').exec

const NETWORKING = 'weave'

const command = (cmd, done) => {
  const runCommand = `kops ${cmd}`
  exec(`kops ${cmd}`, {
    // allow 5MB back on stdout 
    //(which should not happen but some logs might be longer than 200kb which is the default)
    maxBuffer: 1024 * 1024 * 5,
  }, (err, stdout, stderr) => {
    if(err) return done(err)
    done(null, stdout.toString())
  })
}

/*

  create the kops cluster using the cluster settings.json

  {
    domain: "dev.catenasys.com.",
    master_count: 1,
    master_size: "m4.large",
    master_zones: ["eu-west-2a"],
    name: "apples",
    node_count: 3,
    node_size: "m4.large",
    node_zones: ["eu-west-2a"],
    region: "eu-west-2",
    topology: "public",
    public_key: "XXX",
  }

*/
const createCluster = (settings, keyFilePath, done) => {
  command(`create cluster ${settings.name}.${settings.domain} \
    --node-count ${ settings.node_count } \
    --zones ${ settings.node_zones.join(',') } \
    --node-size ${ settings.node_size } \
    --master-count ${ settings.master_count } \
    --master-size ${ settings.master_size } \
    --master-zones ${ settings.master_zones.join(',') } \
    --networking ${ NETWORKING } \
    --state s3://clusters.${ settings.domain } \
    --ssh-public-key ${ keyFilePath } \
    --topology ${ settings.topology } ${ settings.topology == 'private' ? '--bastion=true' : '' } \
    --yes
`, done)
}

const createSecret = (settings, keyFilePath, done) => {
  command(`create secret --name ${settings.name}.${settings.domain} \
    --state s3://clusters.${ settings.domain } \
    sshpublickey admin -i ${keyFilePath}
`, done)
}

const updateCluster = (settings, done) => {
  command(`update cluster ${settings.name}.${settings.domain} \
    --state s3://clusters.${ settings.domain } \
    --yes
`, done)
}

const validateCluster = (settings, done) => {
  command(`validate cluster ${settings.name}.${settings.domain} \
    --state s3://clusters.${ settings.domain }
`, done)
}

module.exports = {
  command,
  createCluster,
  createSecret,
  updateCluster,
  validateCluster,
}