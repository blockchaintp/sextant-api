const AwsRegisterUsage = require('./AwsRegisterUsage')
const AwsMeterUsage = require('./AwsMeterUsage')
const NoopMeter = require('./NoopMeter')

const logger = require('../../logging').getLogger({
  name: __filename,
})

class Meter {
  constructor(name, store, options = {}) {
    this.name = name
    this.store = store
    this.options = 'options' in options ? options : {}
    this.type = 'type' in options ? options.type : 'NoopMeter'
  }

  createMeter() {
    switch (this.type) {
      case 'AwsRegisterUsage':
        return new AwsRegisterUsage(this.name, this.store, this.options)
      case 'AwsMeterUsage':
        return new AwsMeterUsage(this.name, this.store, this.options)
      case 'NoopMeter':
        return new NoopMeter(this.name, this.store, this.options)
      default:
        logger.error(`${this.options.type} is not a valid type`)
        throw new Error(`${this.options.type} is not a valid meter type`);
    }
  }

  start() {
    const meter = this.createMeter()
    return meter.start()
  }
}

module.exports = Meter;
