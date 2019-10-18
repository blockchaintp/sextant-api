

class TemplateLoader {
  constructor(deploymentTypes) {
    this.deploymentTypes = deploymentTypes
  }

  load() {
    return this.deploymentTypes
    .reduce((allTemplates, type) => {
      allTemplates[type] = require(`./${type}`)
      return allTemplates
      }, {}
    )
  }
}

module.exports = {
  TemplateLoader
}
