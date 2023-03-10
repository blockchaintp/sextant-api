/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-var-requires */
const logger = require('../../logging').getLogger({
  name: __filename,
})

const shutdownProcess = (message) => {
  logger.error(`${message}`)
  process.exit(1)
}

const sendCommandOrFail = async (client, command, iamRequired) => {
  try {
    const data = await client.send(command)
    logger.debug({ data }, 'meter command executed successfully')
  } catch (error) {
    logger.warn({ error }, 'meter command failed')

    switch (error.name) {
      case 'UnrecognizedClientException':
      case 'CredentialsProviderError':
      case 'CustomerNotEntitledException':
        shutdownProcess('You are not entitled to use this container in your account')
        break
      case 'DisabledApiException':
        shutdownProcess('Marketplace Metering API is disabled in this region')
        break
      case 'InternalServiceErrorException':
        logger.warn(
          { error },
          'meter command failed unexpectedly.' +
            'An internal error has occurred. The request will be retried.' +
            'If the problem persists, post a message with details on the AWS forums.'
        )
        break
      case 'InvalidProductCodeException':
        shutdownProcess('Invalid product code')
        break
      case 'InvalidPublicKeyVersionException':
        shutdownProcess('Invalid public key version')
        break
      case 'PlatformNotSupportedException':
        shutdownProcess(
          'This container is not supported on the underlying platform.' +
            'Currently, Amazon ECS, Amazon EKS, and AWS Fargate are supported.'
        )
        break
      case 'AccessDeniedException':
        shutdownProcess('AccessDeniedException because no identity-based policy allows' + ` the ${iamRequired} action`)
        break
      default:
        shutdownProcess('command failed with unknown error')
        throw error
    }
  } finally {
    logger.debug({ command }, 'command finished')
    client.destroy()
  }
}

module.exports = {
  sendCommandOrFail,
}
