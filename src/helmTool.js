/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
const childProcess = require('child_process')
// use bluebird to turn the exec function into function that returns promise
const Promise = require('bluebird')

const exec = Promise.promisify(childProcess.exec)
const fsExtra = require('fs-extra')

const logger = require('./logging').getLogger({
  name: 'helmTool',
})

class HelmTool {
  constructor(edition) {
    if (!edition) throw new Error('no edition found')
    if (!edition.helmRepos) throw new Error('no helmRepos found')
    this.helmRepos = edition.helmRepos
    this.chartTable = edition.chartTable
  }

  buildCommand(repo) {
    // iterate over the repo config and build a helm command based on what's included in the config
    // add error handling that filters out username and password from error message
    let command = `helm repo add ${repo.name} ${repo.url}`

    if (repo.username) {
      command += ` --username ${repo.username}`
    }
    if (repo.password) {
      command += ` --password ${repo.password}`
    }
    return command
  }

  async add() {
    // runs helm add for all the repos in the editions object
    // iterate through the repos array adding each one
    const runHelmAdd = async (repo) => {
      const helmCommand = this.buildCommand(repo)
      await exec(helmCommand)
      logger.info({
        action: `adding ${repo.name} repository`,
      })
    }
    for (const repo of this.helmRepos) {
      try {
        await runHelmAdd(repo)
      } catch (err) {
        logger.error({
          action: 'add repository',
          error: err,
        })
        process.exit(1)
      }
    }
  }

  async update() {
    try {
      await exec('helm repo update')
      logger.info({
        action: 'updating helm repositories',
      })
    } catch (err) {
      logger.error({
        action: 'helm repository update',
        error: err,
      })
      process.exit(1)
    }
  }

  async storeChartsLocally() {
    const getExactChartVersion = async (chart, chartVersion) => {
      const searchValue = await exec(`helm search repo ${chart} --version ${chartVersion} -o json`)

      return JSON.parse(searchValue)[0].version
    }

    const removeAndPull = async (deploymentType, deploymentVersion, deploymentVersionData) => {
      const { chart, chartVersion } = deploymentVersionData
      const exactChartVersion = await getExactChartVersion(chart, chartVersion)

      try {
        await fsExtra.remove(`/app/api/helmCharts/${deploymentType}`)
        logger.info({
          action: `removing /app/api/helmCharts/${deploymentType} if found`,
        })
      } catch (e) {
        logger.error({
          action: 'fsExtra.remove()',
          error: e,
        })
      }

      try {
        await exec(`helm pull ${chart} --version ${exactChartVersion} --untar -d /app/api/helmCharts/${deploymentType}/${deploymentVersion}`)
        logger.info({
          action: `untaring the chart into /app/api/helmCharts/${deploymentType}/${deploymentVersion}`,
        })
      } catch (e) {
        logger.error({
          action: 'helm pull command',
          error: e,
        })
      }
    }

    const deploymentTypes = Object.keys(this.chartTable)

    for (const deploymentType of deploymentTypes) {
      const deploymentTypeData = this.chartTable[deploymentType]

      const deploymentVersions = Object.keys(deploymentTypeData)
      for (const deploymentVersion of deploymentVersions) {
        try {
          const deploymentVersionData = deploymentTypeData[deploymentVersion]
          await removeAndPull(deploymentType, deploymentVersion, deploymentVersionData)
        } catch (err) {
          logger.error({
            action: 'remove directory then pull/untar chart',
            error: err,
          })
          process.exit(1)
        }
      }
    }
  }

  async start() {
    await this.add()
    await this.update()
    await this.storeChartsLocally()
  }
}

module.exports = {
  HelmTool,
}
