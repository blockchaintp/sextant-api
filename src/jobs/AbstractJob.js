const Scheduler = require('node-schedule');

const logger = require('../logging').getLogger({
  name: __filename,
})

class AbstractJob {
  constructor(name, options, schedule = '*/5 * * * *') {
    if (name) {
      this.name = name;
    }
    this.schedule = schedule;
  }

  run() {
    throw new Error(`Job.run() must be implemented for ${this.name}`);
  }

  start() {
    logger.info(`Starting job ${this.name} with schedule '${this.schedule}'`);
    this.job = Scheduler.scheduleJob(this.name, this.schedule, () => { this.run() });
  }

  stop() {
    logger.info(`Stopping job ${this.name}`);
    if (this.job !== undefined) {
      this.job.cancel();
    }
  }

  getName() {
    return this.name;
  }

  getSchedule() {
    return this.schedule;
  }

  setSchedule(schedule) {
    if (schedule !== this.schedule) {
      logger.info(`Changing job ${this.name} schedule from '${this.schedule}' ${schedule}`);
      this.schedule = schedule;
      this.job.reschedule(schedule);
    }
  }
}

module.exports = AbstractJob;
