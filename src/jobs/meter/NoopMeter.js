const AbstractJob = require('../AbstractJob');

const logger = require('../../logging').getLogger({
  name: 'tasks/meter/noop',
})

class NoopMeter extends AbstractJob {
  constructor(name = 'NoopMeter', options = {}, schedule = '* * * * *') {
    super(name, options, schedule);
  }

  run() {
    logger.info(`${this.getName()} executed`);
  }
}

module.exports = NoopMeter;
