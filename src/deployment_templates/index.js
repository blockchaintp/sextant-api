// const { edition } = require('../edition')
// const { TemplateLoader } = require('./templateLoader')

// const deployment = edition.deployment
// const templateLoader = new TemplateLoader(deployment.types)

// module.exports = templateLoader.load()

const { mergedDeploymentDetails} = require('./templateLoader')

console.log("DETAILS\n\n", mergedDeploymentDetails());

module.exports = mergedDeploymentDetails()