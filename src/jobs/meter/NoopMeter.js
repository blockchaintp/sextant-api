const AbstractJob = require('../AbstractJob');

const logger = require('../../logging').getLogger({
  name: __filename,
})

class NoopMeter extends AbstractJob {
  constructor(name = 'NoopMeter', store, options = {}, schedule = '* * * * *') {
    super(name, options, schedule);
    this.store = store;
  }

  run() {
    logger.info(`${this.getName()} executed`);
  }
}

module.exports = NoopMeter;
