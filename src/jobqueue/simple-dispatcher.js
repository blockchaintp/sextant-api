const SimpleDispatcher = (emitter) => (job, done) => {
  emitter.emit('job', job)
  done()
}

module.exports = SimpleDispatcher