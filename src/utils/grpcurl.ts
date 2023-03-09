import * as tmp from 'tmp'
import * as fs from 'fs'
import * as childProcess from 'child_process'
import * as util from 'util'
import { getLogger } from '../logging'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/grpcurl',
})

const exec = util.promisify(childProcess.exec)
const writeFile = util.promisify(fs.writeFile)
const deleteFile = util.promisify(fs.unlink)

// we are relying on the pod proxy
const DEFAULT_HOSTNAME = 'localhost'
// 200MB in bytes
// we apply this to grpcurl so we are not limited with our upload message size
const MAX_MESSAGE_SIZE = 200000000

function getOptions(options: { env?: { [key: string]: string }; [key: string]: unknown }) {
  const useOptions: { [key: string]: unknown; env?: { [key: string]: string } } = {
    ...options,
    // allow 5MB back on stdout
    // (which should not happen but some logs might be longer than 200kb which is the default)
    maxBuffer: 1024 * 1024 * 5,
    env: {
      ...process.env,
      ...options.env,
    },
  }
  return useOptions
}

export const Grpcurl = ({
  token,
  port,
  prefix = '',
  hostname = DEFAULT_HOSTNAME,
}: {
  hostname?: string
  port: number
  prefix?: string
  token: string
}) => {
  if (!token) throw new Error('token required for grpcurl')
  if (!port) throw new Error('port required for grpcurl')
  return async ({
    service,
    method,
    data,
    options = {},
  }: {
    data?: string
    method: string
    options?: {
      [key: string]: unknown
      env?: { [key: string]: string }
    }
    service: string
  }) => {
    if (!service) throw new Error('service required for grpcurl')
    if (!method) throw new Error('method required for grpcurl')

    const tokenPath = tmp.tmpNameSync({ postfix: '.txt' })
    const dataPath = tmp.tmpNameSync({ postfix: '.json' })
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
      const runCommand =
        `${dataSource} grpcurl -expand-headers -plaintext -max-msg-sz ${MAX_MESSAGE_SIZE} ` +
        `-H 'Authorization: Bearer \${GRPC_TOKEN}' ${dataFlag} ${hostname}:${port} ${prefix}${service}.${method}`

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.debug({
        action: 'grpcurl',
        command: runCommand,
        service,
        method,
        dataLength: data ? data.length : undefined,
      })
      const result = await exec(runCommand, commandOptions)
      const parsedResult: unknown = result.stdout ? JSON.parse(result.stdout) : {}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      logger.trace({
        action: 'grpcurl',
        service,
        method,
        dataLength: data ? data.length : undefined,
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
