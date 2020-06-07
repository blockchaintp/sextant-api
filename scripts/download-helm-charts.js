const { HelmTool } = require('../src/helmTool')
const { edition } = require('../src/edition.js')
const dotenv = require("dotenv");
dotenv.config();

const pino = require('pino')({
  name: 'download helm charts',
})

//helm add and helm pull(untar sextant)
const runHelmToolStart = async () => {
  if (edition && edition.helmRepos) {
    pino.info({
      action: 'downloading helm charts'
    })
    console.log(edition.helmRepos.map(repo => ` * ${repo.name}`).join("\n"))
    const helmTool = new HelmTool(edition.helmRepos)
    await helmTool.start()
  }
}

runHelmToolStart()