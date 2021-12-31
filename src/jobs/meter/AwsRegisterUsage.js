const { MarketplaceMeteringClient, RegisterUsageCommand } = require('@aws-sdk/client-marketplace-metering');
const uuid = require('uuid').v4;
const { sendCommandOrFail } = require('./AwsMeterUtils');
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
    sendCommandOrFail(client, command, 'aws-marketplace:RegisterUsage')
  }
}

module.exports = AwsRegisterUsage;
