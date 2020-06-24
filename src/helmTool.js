const path = require('path')
const childProcess = require('child_process')
// use bluebird to turn the exec function into function that returns promise
const Promise = require('bluebird')
const exec = Promise.promisify(childProcess.exec)
const fs = require('fs')
const fsExtra = require('fs-extra')

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
    let command = `helm repo add ${ repo.name } ${ repo.url }`

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
      console.log('*********\nUSERNAME ---->', process.env.BTP_DEV_USR,'\n************\n');        

      await exec(helmCommand)
      pino.info({
        action: `adding ${repo.name} repository`
      })
    }
    for (const repo of this.helmRepos) {
      try {
        await runHelmAdd(repo)
      } catch(err) {        
        console.log(err);
        
        pino.error({
          action: `add repository`,
          error: err
        })
        //process.exit(1)
      }
    }
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
      //process.exit(1)
    }
  }

  async storeChartsLocally() {
    const removeAndPull = async (repo, chart) => {
      // await exec(`if [ -d /app/api/helmCharts/${chart} ]; then echo "removing /app/api/helmCharts/${chart}"; rm -rf /app/api/helmCharts/${chart}; fi`)
      try {
        await fsExtra.remove(`/app/api/helmCharts/${chart}`)
        pino.info({
          action: `removing /app/api/helmCharts/${chart} if found`
        })
        await exec(`helm pull ${repo.name}/${chart} --untar -d /app/api/helmCharts`)
        pino.info({
          action: `untaring the chart into /app/api/helmCharts/${chart}`
        })
      } catch (err) {
        pino.error({
          action: 'remove and pull',
          error: err
        })
      }
    }
 
    for(const repo of this.helmRepos) {
      for(const chart of repo.charts) {
        try {
          await removeAndPull(repo, chart)
        } catch (err) {
          pino.error({
            action: 'remove directory then pull/untar chart',
            error: err
          })
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
  HelmTool
}