const tmp = require('tmp')
const fs = require('fs')
const async = require('async')
const { exec } = require('child_process')

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
    (next) => {
      tmp.dir({
        mode: 0o750, // NOSONAR
        prefix: 'sshkeygen_',
        unsafeCleanup: true,
      }, (err, path, cleanup) => {
        if (!err) {
          context.cleanup = cleanup
          context.directory = path
          next()
        }
        return next(err)
      })
    },

    // call ssh-keygen in the temporary directory
    (next) => {
      const command = `ssh-keygen -t rsa -N "" -f ${context.directory}/id_rsa`
      exec(command, (err) => {
        if (!err) {
          next()
        }
        return next(err)
      })
    },

    // slurp both files
    (next) => {
      async.parallel({
        publicKey: (nextFile) => fs.readFile(`${context.directory}/id_rsa.pub`, 'utf8', nextFile),
        privateKey: (nextFile) => fs.readFile(`${context.directory}/id_rsa`, 'utf8', nextFile),
      }, (err, results) => {
        if (!err) {
          context.results = results
          next()
        }
        return next(err)
      })
    },

  ], (err) => {
    // make sure we cleanup even if there was an error after tmp directory creation
    if (context.cleanup) context.cleanup()
    if (!err) {
      done(null, context.results)
    }
    return done(err)
  })
}

module.exports = {
  createKeypair,
}
