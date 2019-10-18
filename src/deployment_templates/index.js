const { edition } = require('../edition')
const { TemplateLoader } = require('./templates')

const deployment = edition.deployment
const templateLoader = new TemplateLoader(deployment.types)

module.exports = templateLoader.load()
