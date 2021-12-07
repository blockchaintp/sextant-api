const AbstractJob = require('../AbstractJob');

const logger = require('../../logging').getLogger({
  name: 'jobs/meter/AWSMeterUsage',
})

class AwsMeterUsage extends AbstractJob {
  constructor(name = 'AwsMeterUsage', options = {}, schedule = '* * * * *') {
    super(name, options, schedule);
  }

  run() {
    logger.info(`${this.getName()} executed`);
  }
}

module.exports = AwsMeterUsage;
