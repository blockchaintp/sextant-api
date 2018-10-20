/*

  wrap kubetpl to generate yaml text
  
*/

const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const pino = require('pino')({
  name: 'template',
})
const utils = require('./utils')

// render a template given a values file and a template path
const render = (valuesPath, templatePath, done) => {

  templatePath = utils.fullTemplatePath(templatePath)

  const runCommand = `kubetpl render -i ${valuesPath} ${templatePath}`

  pino.info({
    action: 'render',
    command: runCommand,
  })

  exec(runCommand, {}, (err, stdout, stderr) => {
    if(err) return done(err)
    done(null, stdout.toString())
  })
}

module.exports = render
