/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */

const { exec } = require('child-process-promise')
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
      logger.info({
        action: `adding ${repo.name} repository`,
      })
      const helmCommand = this.buildCommand(repo)
      logger.debug({ action: 'helm add', command: helmCommand })
      const result = await exec(helmCommand)
      logger.trace({ action: 'helm add', command: helmCommand, result })
      return result
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
      logger.info({
        action: 'updating helm repositories',
      })
      const command = 'helm repo update'
      logger.debug({ action: 'helm repo update', command })
      const result = await exec(command)
      logger.trace({ action: 'helm repo update', command, result })
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
      const cmd = `helm search repo ${chart} --version ${chartVersion} -o json`
      logger.debug({ action: 'getExactChartVersion', command: cmd })
      const searchValue = await exec(cmd)
      logger.trace({ action: 'getExactChartVersion', command: cmd, result: searchValue })
      return JSON.parse(searchValue)[0].version
    }

    const remove = async (deploymentType) => {
      try {
        logger.debug(
          {
            fn: 'storeChartsLocally.remove',
          },
          `removing /app/api/helmCharts/${deploymentType} if found`
        )
        await fsExtra.remove(`/app/api/helmCharts/${deploymentType}`)
      } catch (error) {
        logger.error({
          fn: 'fsExtra.remove()',
          error,
        })
        throw error
      }
    }

    const pull = async (chart, exactChartVersion, deploymentType, deploymentVersion) => {
      const cmd = `helm pull ${chart} --version ${exactChartVersion} --untar -d /app/api/helmCharts/${deploymentType}/${deploymentVersion}`
      try {
        logger.debug(
          {
            fn: 'storeChartsLocally.removeAndPull',
          },
          `untaring the chart into /app/api/helmCharts/${deploymentType}/${deploymentVersion}`
        )
        logger.debug({ fn: 'removeAndPull', command: cmd }, 'helm pull')
        const result = await exec(cmd)
        logger.trace({ fn: 'removeAndPull', command: cmd, result }, 'helm pull')
        return result
      } catch (error) {
        logger.error({ fn: 'removeAndPull', command: cmd, error }, 'error in helm pull')
        throw error
      }
    }

    const removeAndPull = async (deploymentType, deploymentVersion, deploymentVersionData) => {
      const { chart, chartVersion } = deploymentVersionData
      const exactChartVersion = await getExactChartVersion(chart, chartVersion)

      await remove(deploymentType)

      await pull(chart, exactChartVersion, deploymentType, deploymentVersion)
    }

    const deploymentTypes = Object.keys(this.chartTable)

    for (const deploymentType of deploymentTypes) {
      const deploymentTypeData = this.chartTable[deploymentType]

      const deploymentVersions = Object.keys(deploymentTypeData)
      for (const deploymentVersion of deploymentVersions) {
        try {
          const deploymentVersionData = deploymentTypeData[deploymentVersion]
          await removeAndPull(deploymentType, deploymentVersion, deploymentVersionData)
        } catch (error) {
          logger.error({ fn: 'removeAndPull', error }, 'error in helm pull')
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
