const path = require('path')
const childProcess = require('child_process')
// use bluebird to turn the exec function into function that returns promise
const Promise = require('bluebird')
const exec = Promise.promisify(childProcess.exec)
const fs = require('fs')

const pino = require('pino')({
  name: 'helm tool',
})

class HelmTool {
  constructor(helmRepos) {
    if (!helmRepos) throw new Error(`no helmRepos found`)
    this.helmRepos = helmRepos
  }

  buildCommand(repo) {
    // iterate over the repo config and build a helm command based on what's included in the config
    // add error handling that filters out username and password from error message
    let command = 'helm repo add'
    command += ` ${repo.name}`
    command += ` ${repo.url}`
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
      pino.info({
        action: `adding ${repo.name} repository`
      })
    }
    for (repo of helmRepos) {
      try {
        runHelmAdd(repo)
      } catch(err) {
        pino.error({
          action: `add repository`,
          error: err
        })
        process.exit(1)
      }
    }
    // try {
    //   this.helmRepos
    //     .forEach(async (repo) => {
    //       const helmCommand = this.buildCommand(repo)
    //       await exec(helmCommand)
    //       pino.info({
    //         action: `adding ${repo.name} repository`
    //       })
    //     })
    // } catch (err) {
    //   pino.error({
    //     action: `add repository`,
    //     error: err
    //   })
    //   process.exit(1)
    // }
  }

  async update() {
    try {
      await exec(`helm repo update`)
      pino.info({
        action: `updating helm repositories`
      })
    } catch (err) {
      pino.error({
        action: 'helm repository update',
        error: err
      })
      process.exit(1)
    }
  }

  async storeChartsLocally() {
    // may use .then/catch for these promises
    const removeAndPull = async (repo, chart) => {
      await exec(`if [ -d /app/api/helmCharts/${chart} ]; then echo "removing /app/api/helmCharts/${chart}"; rm -rf /app/api/helmCharts/${chart}; fi`)
      pino.info({
        action: `removing /app/api/helmCharts/${chart} if found`
      })
      await exec(`helm pull ${repo.name}/${chart} --untar -d /app/api/helmCharts`)
      pino.info({
        action: `untaring the chart into /app/api/helmCharts/${chart}`
      })
    }
 
    for(repo of helmRepos) {
      for(chart of repo.charts) {
        try {
          removeAndPull(repo, chart)
        } catch (err) {
          pino.error({
            action: 'remove directory then pull/untar chart',
            error: err
          })
        }
      }
    }

    // this.helmRepos
    //   .forEach(
    //     (repo) => {
    //       repo.charts
    //         .forEach(
    //           async (chart) => {
    //             try {
    //               await exec(`if [ -d /app/api/helmCharts/${chart} ]; then echo "removing /app/api/helmCharts/${chart}"; rm -rf /app/api/helmCharts/${chart}; fi`)
    //             } catch (err) {
    //               pino.error({
    //                 action: 'removing output directory',
    //                 error: err
    //               })
    //             }
    //             try {
    //               await exec(`helm pull ${repo.name}/${chart} --untar -d /app/api/helmCharts`)
    //               pino.info({
    //                 action: `pulling and untarring the chart`,
    //                 chart: chart
    //               })
    //             } catch (err) {
    //               pino.error({
    //                 action: 'pulling and untarring the chart',
    //                 error: err
    //               })
    //               process.exit(1)
    //             }
    //           }
    //         )
    //     }
    //   )
  }

  async start() {
    await this.add()
    await Promise.delay(5000)
    await this.update()
    await this.pull()
  }
}


module.exports = {
  HelmTool
}