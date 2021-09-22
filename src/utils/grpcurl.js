/* eslint-disable max-len */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-unneeded-ternary */
const Promise = require('bluebird')
const tmp = require('tmp')
const fs = require('fs')
const childProcess = require('child_process')

const logger = require('../logging').getLogger({
  name: 'utils/grpcurl',
})

const exec = Promise.promisify(childProcess.exec)
const tempName = Promise.promisify(tmp.tmpName)
const writeFile = Promise.promisify(fs.writeFile)
const deleteFile = Promise.promisify(fs.unlink)

// we are relying on the pod proxy
const DEFAULT_HOSTNAME = 'localhost'
// 200MB in bytes
// we apply this to grpcurl so we are not limited with our upload message size
const MAX_MESSAGE_SIZE = 200000000

const getOptions = (options) => {
  const useOptions = {
    ...options,
    // allow 5MB back on stdout
    // (which should not happen but some logs might be longer than 200kb which is the default)
    maxBuffer: 1024 * 1024 * 5,
  }
  useOptions.env = { ...process.env, ...options.env }
  return useOptions
}

const Grpcurl = ({
  token,
  port,
  prefix = '',
  hostname = DEFAULT_HOSTNAME,
} = {}) => {
  if (!token) throw new Error('token required for grpcurl')
  if (!port) throw new Error('port required for grpcurl')
  return async ({
    service,
    method,
    data,
    options = {},
  } = {}) => {
    if (!service) throw new Error('service required for grpcurl')
    if (!method) throw new Error('method required for grpcurl')

    const tokenPath = await tempName({ postfix: '.txt' })
    const dataPath = await tempName({ postfix: '.json' })
    await writeFile(tokenPath, token, 'utf8')
    if (data) {
      await writeFile(dataPath, JSON.stringify(data), 'utf8')
    }

    // cleanup token and data files in both error and success cases
    const cleanup = async () => {
      await deleteFile(tokenPath)
      if (data) {
        await deleteFile(dataPath)
      }
    }

    try {
      // inject the token as a variable so it is not listed in "ps -ef"
      const commandOptions = getOptions(options)
      commandOptions.env.GRPC_TOKEN = token

      // if we have data - we pipe it from a tempfile
      const dataSource = data ? `cat ${dataPath} |` : ''
      const dataFlag = data ? '-d @' : ''

      // the grpcurl command
      // in the patched grpcurl -max-msg-sz applies to both request + response
      const runCommand = `${dataSource} grpcurl -plaintext -max-msg-sz ${MAX_MESSAGE_SIZE} -H 'Authorization: $GRPC_TOKEN' ${dataFlag} ${hostname}:${port} ${prefix}${service}.${method}`

      // run it
      const result = await exec(runCommand, commandOptions)
      const parsedResult = result ? JSON.parse(result) : {}
      logger.info({
        service,
        method,
        data,
        parsedResult,
      })
      await cleanup()
      return parsedResult
    } catch (e) {
      await cleanup()
      throw e
    }
  }
}

module.exports = Grpcurl
