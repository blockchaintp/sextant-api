const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')
const {createHash} = require('crypto')
const protobuf = require('sawtooth-sdk/protobuf')

const context = createContext('secp256k1')
const addressUtils = require('./address')
const keyUtils = require('./key')

const getSigner = (privateKeyHex) => {
  const privateKey = keyUtils.privateKeyFromHex(privateKeyHex)
  return new CryptoFactory(context).newSigner(privateKey)
}

let nonce = 0

const createTransaction = (opts) => {

  const {
    privateKeyHex,
    gameName,
    payload,
  } = opts

  const address = addressUtils.getGameAddress(gameName)
  const signer = getSigner(privateKeyHex)

  nonce++

  const transactionHeaderBytes = protobuf.TransactionHeader.encode({
    familyName: 'xo',
    familyVersion: '1.0',
    inputs: [address],
    outputs: [address],
    signerPublicKey: signer.getPublicKey().asHex(),
    batcherPublicKey: signer.getPublicKey().asHex(),
    dependencies: [],
    payloadSha512: createHash('sha512').update(payload).digest('hex'),
    nonce: nonce.toString(),
  }).finish()

  const signature = signer.sign(transactionHeaderBytes)

  return protobuf.Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: Buffer.from(payload, 'utf8'),
  })
}

const createBatch = (opts) => {

  const {
    privateKeyHex,
    transactions,
  } = opts

  const signer = getSigner(privateKeyHex)

  const batchHeaderBytes = protobuf.BatchHeader.encode({
    signerPublicKey: signer.getPublicKey().asHex(),
    transactionIds: transactions.map((txn) => txn.headerSignature),
  }).finish()

  const signature = signer.sign(batchHeaderBytes)

  return protobuf.Batch.create({
    header: batchHeaderBytes,
    headerSignature: signature,
    transactions: transactions
  })
}

const getBatchListBytes = (batches) => {
  return protobuf.BatchList.encode({
    batches
  }).finish()
}

// encode a single transaction as a batch list in bytes
const singleTransactionBytes = (opts) => {
  const {
    privateKeyHex,
    gameName,
    payload,
  } = opts

  const transaction = createTransaction({
    privateKeyHex,
    gameName,
    payload,
  })

  const batch = createBatch({
    privateKeyHex,
    transactions: [transaction]
  })

  return getBatchListBytes([batch])
}

const utils = {
  getSigner,
  createTransaction,
  createBatch,
  getBatchListBytes,
  singleTransactionBytes,
}

module.exports = utils