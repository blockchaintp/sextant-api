const { edition } = require('../edition')
const { TemplateLoader } = require('./templateLoader')

const deployment = edition.deployment
const templateLoader = new TemplateLoader(deployment.types)

module.exports = templateLoader.load()
