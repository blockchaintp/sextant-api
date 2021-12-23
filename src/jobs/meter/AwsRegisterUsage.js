const { MarketplaceMeteringClient, RegisterUsageCommand } = require('@aws-sdk/client-marketplace-metering');
const uuid = require('uuid').v4;
const AbstractJob = require('../AbstractJob');
const AWS = require('../../utils/aws');

const logger = require('../../logging').getLogger({
  name: __filename,
})

class AwsRegisterUsage extends AbstractJob {
  constructor(store, name = 'AwsRegisterUsage', options = {}, schedule = '? * * * *') {
    super(name, options, schedule);
    this.store = store
    this.initProductDetails(options);
  }

  initProductDetails(options) {
    const { productCode, publicKeyVersion } = options;
    this.productCode = productCode;
    this.publicKeyVersion = publicKeyVersion;
    this.region = undefined;
  }

  start() {
    // Run once immediately
    this.run();
    super.start();
  }

  async run() {
    if (this.region === undefined) {
      this.region = await AWS.getRegion();
      logger.info(`Using region ${this.region}`);
    }

    logger.trace({
      publicKeyVersion: this.publicKeyVersion,
      productCode: this.productCode,
    }, `${this.getName()} executing`);

    const client = new MarketplaceMeteringClient({ region: this.region });
    logger.trace('created client');

    const params = {
      ProductCode: this.productCode,
      PublicKeyVersion: this.publicKeyVersion,
      Nonce: uuid(),
    }
    const command = new RegisterUsageCommand(params);
    logger.trace({ params }, 'created command');
    try {
      const data = await client.send(command);
      logger.debug({ data }, `${this.getName()} RegisterUsageCommand executed successfully`);
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
            + ' the aws-marketplace:RegisterUsage action')
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
      client.destroy();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  shutdownProcess(message) {
    logger.error(`${message}`);
    process.exit(1);
  }

  validateResponse(response, params) {
    logger.debug({ response, params }, `${this.getName()} validating response`);
    return true;
  }
}

module.exports = AwsRegisterUsage;
