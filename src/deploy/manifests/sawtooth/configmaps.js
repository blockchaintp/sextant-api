const randomstring = require('randomstring')

const ConfigMaps = ({ clusterSettings }) => {

  const secretKey = randomstring.generate({
    length: 20,
    charset: 'alphabetic'
  })

  const aesKey = randomstring.generate({
    length: 32,
    charset: 'hex'
  })

  const batcherPrivateKey = randomstring.generate({
    length: 64,
    charset: 'hex'
  })

  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: rbac-config
  labels:
    app: sawtooth-next
data:
  config.py: |
    HOST = 'localhost'
    PORT = 8000
    TIMEOUT = 500
    KEEP_ALIVE = False
    VALIDATOR_HOST = 'sawtooth-validator'
    VALIDATOR_PORT = 4004
    DB_HOST = 'localhost'
    DB_PORT = 28015
    DEBUG = True
    SECRET_KEY = '${ secretKey }'
    AES_KEY = '${ aesKey }'
    BATCHER_PRIVATE_KEY = '${ batcherPrivateKey }'
`
} 

module.exports = ConfigMaps