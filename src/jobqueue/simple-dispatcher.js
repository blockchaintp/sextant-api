const SimpleDispatcher = (emitter) => (job, done) => {

  if(!job.name) return done('job payload needs a name property')
  if(!job.params) return done('job payload needs a params property')

  emitter.emit('job', job)
  done()
}

module.exports = SimpleDispatcher