const pino = require('pino')({
  name: 'meter function',
})

class Meter {
  constructor(meteringDetails) {
    this.meteringDetails = meteringDetails
    this.meteringType = this.meteringDetails.type
    this.meter = require(`./${this.meteringType}`)
  }

  start() {
    this.meter.start(this.meteringDetails)
  }

  stop() {
    this.meter.stop()
  }

  isAllowed(entitlement) {
    this.meter.isAllowed(entitlement)
  }

  record(dimension, value) {
    this.meter.record(entitlement, value)
  }

}


module.exports = {
  Meter
}
