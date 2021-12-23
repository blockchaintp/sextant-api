const Promise = require('bluebird');
const { MarketplaceMeteringClient, MeterUsageCommand } = require('@aws-sdk/client-marketplace-metering');
const { DEPLOYMENT_STATUS } = require('../../config');
const AWS = require('../../utils/aws');
const ClusterKubectl = require('../../utils/clusterKubectl');
const { deploymentToHelmRelease } = require('../../utils/deploymentNames');
const AbstractJob = require('../AbstractJob');

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
    this.store = store;
    this.softwareStart = new Date()
    this.productCode = options.productCode || 'dummycode';
    this.publicKeyVersion = options.publicKeyVersion || 'dummykey';
    this.region = undefined;
  }

  start() {
    // Run once immediately
    this.run();
    super.start();
  }

  // eslint-disable-next-line class-methods-use-this
  async resourcesForDeployment(cluster, deployment) {
    if (deployment.deployment_type in nodeChargeableMap) {
      const metricDefinition = nodeChargeableMap[deployment.deployment_type]

      const { store } = this;
      logger.trace({ deployment }, 'using deployment details')
      const release = deploymentToHelmRelease(deployment)
      return ClusterKubectl({ cluster, store })
        .then((kubectl) => kubectl.getPods(release.namespace, {
          labelSelector: metricDefinition.labelSelector,
        }))
        .then((body) => {
          const retItem = {}
          retItem[metricDefinition.metric] = body.items.length
          return retItem
        })
    }
    return []
  }

  async run() {
    const region = await AWS.getRegion();
    const client = new MarketplaceMeteringClient({ region })

    logger.debug(`${this.getName()} executed for ${currentHour()}`);
    const activeDeployments = await this.store.deploymenthistory.list({ after: currentHour() })
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
      logger.trace(`Found ${typedDeployments.length} ${k} deployments`);
      if (typedDeployments.length > 0) {
        return typedDeployments.flatMap((checkDeployment) => {
          const cluster = clusters.find((c) => c.id === checkDeployment.cluster)
          logger.trace({ cluster },
            `Found deployment of type ${checkDeployment.deployment_type} in cluster ${cluster.id}`)
          return {
            deployment: checkDeployment,
            cluster,
          }
        })
      }
      return []
    })

    const deployments2resources = deployments2Clusters.map(
      (pair) => this.resourcesForDeployment(pair.cluster, pair.deployment)
        .then((resources) => ({
          deployment: pair.deployment,
          resources,
        })),
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
      logger.info({ params }, `${this.getName()} command for ${currentHour()}`);
      return new MeterUsageCommand(params)
    })
    await commands.map((command) => this.sendCommandOrFail(command, client))
  }

  async sendCommandOrFail(command, client) {
    try {
      logger.info(`${this.getName()} send command for ${currentHour()}`);
      const data = await client.send(command);
      logger.info({ data }, `${this.getName()} MeterUsageCommand executed successfully`);
    } catch (error) {
      logger.error({ error }, `${this.getName()} failed`);

      switch (error.name) {
        case 'UnrecognizedClientException':
        case 'CredentialsProviderError':
        case 'CustomerNotEntitledException':
          this.shutdownProcess('You are not entitled to use this container in your account');
          break;
        case 'DisabledApiException':
          this.shutdownProcess(`Marketplace Metering API is disabled in this region ${this.region}`);
          break;
        case 'InternalServiceErrorException':
          logger.warn({ error }, `${this.getName()} failed unexpectedly.`
            + 'An internal error has occurred. The request will be retried.'
            + 'If the problem persists, post a message with details on the AWS forums.');
          break;
        case 'InvalidProductCodeException':
          this.shutdownProcess(`Invalid product code ${this.productCode}`);
          break;
        case 'InvalidPublicKeyVersionException':
          this.shutdownProcess(`Invalid public key version ${this.publicKeyVersion}`);
          break;
        case 'PlatformNotSupportedException':
          this.shutdownProcess('This container is not supported on the underlying platform.'
            + 'Currently, Amazon ECS, Amazon EKS, and AWS Fargate are supported.');
          break;
        case 'AccessDeniedException':
          this.shutdownProcess('AccessDeniedException because no identity-based policy allows'
            + ' the aws-marketplace:MeterUsage action');
          break;
        default:
          this.shutdownProcess(`${this.getName()} failed with unknown error`);
          throw error;
      }
    } finally {
      logger.debug({
        publicKeyVersion: this.publicKeyVersion,
        productCode: this.productCode,
      }, `${this.getName()} finished`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  shutdownProcess(message) {
    logger.error(`${message}`);
    process.exit(1);
  }

  async activeDeployments(deploymentIds) {
    return Promise.map(deploymentIds, (deploymentId) => this.store.deployment.get({ id: deploymentId.deployment_id }))
  }
}

module.exports = AwsMeterUsage;
