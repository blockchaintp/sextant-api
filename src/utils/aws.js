const exec = require('child_process').exec

/*

  run an aws command

  we assume that one of the following two is true:

    * both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are defined
    * the ec2 instance has the sextant-instance IAM role associated with it
  
  we always output data as JSON and process it before returning

  example:

  aws.command('route53 list-hosted-zones', (err, result) => {
  
  })

*/
const command = (cmd, done) => {
  const awsCommand = `aws --output json ${cmd}`
  exec(awsCommand, (err, stdout, stderr) => {
    if(err) return done(err)
    let processedResult = null
    try {
      processedResult = JSON.parse(stdout)
    } catch(e) {
      return done(e.toString())
    }
    done(null, processedResult)
  })
}

/*

  helper wrappers
  
*/

const listRoute53Domains = (done) => command(`route53 list-hosted-zones`, done)

module.exports = {
  command,
  listRoute53Domains,
}