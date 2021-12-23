const AbstractJob = require('../AbstractJob');

const logger = require('../../logging').getLogger({
  name: __filename,
})

class NoopMeter extends AbstractJob {
  constructor(store, name = 'NoopMeter', options = {}, schedule = '* * * * *') {
    super(name, options, schedule);
    this.store = store;
  }

  run() {
    logger.info(`${this.getName()} executed`);
  }
}

module.exports = NoopMeter;
