const tmp = require('tmp')
const fs = require('fs')
const async = require('async')
const exec = require('child_process').exec

/*

  generate an SSH keypair in a temporary directory
  make sure to delete the files once they have been created

  return an object with:

   * publicKey
   * privateKey

*/
const createKeypair = (done) => {

  const context = {}
  async.series([

    // create a temporary directory to work in
    next => {
      tmp.dir({
        mode: 0750, 
        prefix: 'sshkeygen_',
        unsafeCleanup: true,
      }, (err, path, cleanup) => {
        if(err) return next(err)
        context.cleanup = cleanup
        context.directory = path
        next()
      })
    },

    // call ssh-keygen in the temporary directory
    next => {
      const command = `ssh-keygen -t rsa -N "" -f ${context.directory}/id_rsa`
      exec(command, (err) => {
        if(err) return next(err)
        next()
      })
    },

    // slurp both files
    next => {
      async.parallel({
        publicKey: nextFile => fs.readFile(`${context.directory}/id_rsa.pub`, 'utf8', nextFile),
        privateKey: nextFile => fs.readFile(`${context.directory}/id_rsa`, 'utf8', nextFile),
      }, (err, results) => {
        if(err) return next(err)
        context.results = results
        next()
      })
    }

  ], (err) => {
    // make sure we cleanup even if there was an error after tmp directory creation
    if(context.cleanup) context.cleanup()
    if(err) return done(err)
    done(null, context.results)
  })
}

module.exports = {
  createKeypair,
}