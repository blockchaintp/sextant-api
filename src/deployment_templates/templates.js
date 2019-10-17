

class Templates {
  constructor(deploymentTypes) {
    this.deploymentTypes = deploymentTypes
  }

  get() {
    return this.deploymentTypes
    .reduce((allTemplates, type) => {
      allTemplates[type] = require(`./${type}`)
      return allTemplates
      }, {}
    )
  }
}

module.exports = {
  Templates
}
