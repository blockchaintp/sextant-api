/*

  an abstraction onto deployments of k8s objects

  this means we can handle various different tricks for deploying things
  without changing any of the rest of the codebase

  the constructor is passed a "utils/kubectl" instance that is bound
  to a cluster

  each method represents a single resource - how that resource is actually
  deployed is up to it
  
*/

const path = require('path')
const fs = require('fs')
const pino = require('pino')({
  name: 'deploy',
})

const settings = require('../settings')
const SawtoothManifests = require('./manifests/sawtooth')

const Deploy = ({ kubectl }) => {

  /*
  
    creates a cluster-admin clusterrole for the "system:serviceaccount:kube-system:default"

    this is needed by the route53Mapper in particular so it can list all other services to check
    if they have match a "dns=route53" selector
    
  */
  const createClusterAdminServiceAccount = (params, done) => {
    kubectl.command(`create clusterrolebinding \
      --user system:serviceaccount:kube-system:default \
      kube-system-cluster-admin --clusterrole cluster-admin`, 
    done)
  }

  /*
  
    creates a cluster-admin clusterrole for the "system:serviceaccount:kube-system:kubernetes-dashboard"

    this is so the user can skip authentication for the dashboard
    
  */
  const createDashboardServiceAccount = (params, done) => {
    kubectl.command(`create clusterrolebinding \
      --user system:serviceaccount:kube-system:kubernetes-dashboard \
      kube-system-cluster-admin --clusterrole cluster-admin`, 
    done)
  }

  /*
  
    dashboard

    deploy the k8s dashboard from a remote url (configured in settings.js)

    params:
    
  */
  const dashboard = (params, done) => {
    const dashboardParams = {
      resource: settings.dashboardManifest
    }
    pino.info({
      action: 'deploy-dashboard',
      params: dashboardParams
    })
    kubectl.apply(dashboardParams, done)
  }

  /*
  
    route 53 mapper

    we have downloaded this locally so we can add the toleration such that this pod
    can schedule to the master

    params:
    
  */
  const route53Mapper = (params, done) => {
    const resource = path.join(__dirname, 'manifests', 'route53-mapper', 'v1.3.0.yml')
    const route53MapperParams = { resource }
    pino.info({
      action: 'deploy-route53-mapper',
      params: route53MapperParams
    })
    kubectl.apply(route53MapperParams, done)
  }

  /*
  
    deploy the manifests for a sawtooth cluster

    params:

     * clusterSettings - the settings used to create the cluster
    
  */
  const sawtoothManifests = (params, done) => {
    if(!params.clusterSettings) return done(`clusterSettings param needed for deploy.sawtoothManifests`)

    const manifestYaml = SawtoothManifests({
      clusterSettings: params.clusterSettings,
    })

    fs.writeFileSync('/app/api/src/manifests.yaml', manifestYaml, 'utf8')

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log(manifestYaml)

    done()
  }
  
  return {
    createClusterAdminServiceAccount,
    createDashboardServiceAccount,
    dashboard,
    route53Mapper,
    sawtoothManifests,
  }
}

module.exports = Deploy