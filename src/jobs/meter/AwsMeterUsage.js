const { DEPLOYMENT_STATUS } = require('../../config');
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

class AwsMeterUsage extends AbstractJob {
  constructor(name = 'AwsMeterUsage', store, options = {}, schedule = '* * * * *') {
    super(name, options, schedule);
    this.store = store;
  }

  start() {
    // Run once immediately
    this.run();
    super.start();
  }

  run() {
    logger.info(`${this.getName()} executed for ${currentHour()}`);
    this.store.deploymenthistory.list({ after: currentHour() })
      .where('status', '=', DEPLOYMENT_STATUS.provisioned)
      .clear('select')
      .distinct('deployment_id')
      .then((deployments) => {
        logger.info({ deployments }, `${this.getName()} found ${deployments.length} items`)
      })
  }
}

module.exports = AwsMeterUsage;
