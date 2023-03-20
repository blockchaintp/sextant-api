/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const Promise = require('bluebird')
const { MarketplaceMeteringClient, MeterUsageCommand } = require('@aws-sdk/client-marketplace-metering')
const { sendCommandOrFail } = require('./AwsMeterUtils')
const { DEPLOYMENT_STATUS } = require('../../config')
const { AWS } = require('../../utils/aws')
const { Kubectl } = require('../../utils/kubectl')
const { deploymentToHelmRelease } = require('../../utils/deploymentNames')
const AbstractJob = require('../AbstractJob')

const logger = require('../../logging').getLogger({
  name: __filename,
})

const currentHour = () => {
  const now = new Date()
  now.setMilliseconds(0)
  now.setSeconds(0)
  now.setMinutes(0)
  return now
}

const nodeChargeableMap = {
  besu: {
    metric: 'dltNodeHrs',
    labelSelector: 'component=besu',
  },
  sawtooth: {
    metric: 'dltNodeHrs',
    labelSelector: 'component=sawtooth',
  },
  'daml-on-besu': {
    metric: 'damlDltNodeHrs',
    labelSelector: 'component=besu',
  },
  'daml-on-sawtooth': {
    metric: 'damlDltNodeHrs',
    labelSelector: 'component=tp',
  },
  'daml-on-qldb': {
    metric: 'damlQLDBHrs',
    labelSelector: 'component=daml',
  },
  'daml-on-postgres': {
    metric: 'damlPostgresHrs',
    labelSelector: 'component=daml',
  },
  'tfs-on-sawtooth': {
    metric: 'tfsDltNodeHrs',
    labelSelector: 'component=tfs',
  },
}

class AwsMeterUsage extends AbstractJob {
  constructor(store, name = 'AwsMeterUsage', options = {}, schedule = '25,55 * * * *') {
    super(name, options, schedule)
    logger.trace({ options }, 'initializing AwsMeterUsage')
    this.store = store
    this.softwareStart = new Date()
    this.productCode = options.productCode || 'dummycode'
    this.publicKeyVersion = options.publicKeyVersion || 'dummykey'
    this.region = undefined
  }

  // eslint-disable-next-line class-methods-use-this

  activeDeployments(deploymentIds) {
    return Promise.map(deploymentIds, (deploymentId) => this.store.deployment.get({ id: deploymentId.deployment_id }))
  }

  resourcesForDeployment(cluster, deployment) {
    if (deployment.deployment_type in nodeChargeableMap) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const metricDefinition = nodeChargeableMap[deployment.deployment_type]

      const { store } = this
      logger.trace({ deployment }, 'using deployment details')
      const release = deploymentToHelmRelease(deployment)
      return Kubectl.getKubectlForCluster({ cluster, store })
        .then((kubectl) =>
          kubectl.getPods(release.namespace, {
            labelSelector: metricDefinition.labelSelector,
          })
        )
        .then((body) => {
          const retItem = {}
          retItem[metricDefinition.metric] = body.items.length
          return retItem
        })
    }
    return Promise.resolve({})
  }

  async run() {
    const region = await AWS.getRegion()
    const client = new MarketplaceMeteringClient({ region })

    logger.debug(`${this.getName()} executed for ${currentHour()}`)
    const activeDeployments = await this.store.deploymenthistory
      .list({ after: currentHour() })
      .where('status', '=', DEPLOYMENT_STATUS.provisioned)
      .clear('select')
      .distinct('deployment_id')
      .then((deploymentIds) => this.activeDeployments(deploymentIds))
    const activeDeploymentTypes = activeDeployments.map((deployment) => deployment.deployment_type)

    const activeDeploymentTypeCount = activeDeploymentTypes.reduce((accumulator, currentValue) => {
      accumulator[currentValue] = (accumulator[currentValue] || 0) + 1
      if (currentValue in nodeChargeableMap) {
        accumulator.deploymentHrs = (accumulator.deploymentHrs || 0) + 1
      }
      return accumulator
    }, {})

    const clusters = activeDeployments.map((d) => this.store.cluster.get({ id: d.cluster }))

    const deployments2Clusters = Object.keys(nodeChargeableMap).flatMap((k) => {
      const typedDeployments = activeDeployments.filter((d) => d.deployment_type === k)
      logger.trace(`Found ${typedDeployments.length} ${k} deployments`)
      if (typedDeployments.length > 0) {
        return typedDeployments.flatMap((checkDeployment) => {
          const cluster = clusters.find((c) => c.id === checkDeployment.cluster)
          logger.trace(
            { cluster },
            `Found deployment of type ${checkDeployment.deployment_type} in cluster ${cluster.id}`
          )
          return {
            deployment: checkDeployment,
            cluster,
          }
        })
      }
      return []
    })

    const deployments2resources = deployments2Clusters.map((pair) =>
      this.resourcesForDeployment(pair.cluster, pair.deployment).then((resources) => ({
        deployment: pair.deployment,
        resources,
      }))
    )

    const metricsCalculation = deployments2resources.reduce((accumulator, current) => {
      const { resources } = current
      // for each key in resources add the value to the accumulator
      Object.keys(resources).forEach((key) => {
        accumulator[key] = (accumulator[key] || 0) + resources[key]
      })
      return accumulator
    }, {})

    const reading = metricsCalculation
    reading.sextantHrs = 1
    reading.deploymentHrs = activeDeploymentTypeCount.deploymentHrs || 0

    const commands = Object.keys(reading).map((key) => {
      const ts = currentHour() < this.softwareStart ? this.softwareStart : currentHour()
      const params = {
        DryRun: false,
        ProductCode: this.productCode,
        PublicKeyVersion: this.publicKeyVersion,
        Timestamp: ts,
        UsageDimension: key,
        UsageQuantity: reading[key],
      }
      logger.info({ params }, `${this.getName()} command for ${currentHour()}`)
      return new MeterUsageCommand(params)
    })
    commands.forEach((command) => void sendCommandOrFail(client, command, 'aws-marketplace:MeterUsage'))
  }

  start() {
    // Run once immediately
    void this.run()
    super.start()
  }
}

module.exports = AwsMeterUsage
