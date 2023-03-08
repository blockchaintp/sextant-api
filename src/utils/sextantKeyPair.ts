import * as secp256k1 from './secp256k1'
import * as base64 from './base64'
import { getLogger } from '../logging'
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { Knex } from 'knex'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/sextantKeyPair',
})

export async function create(
  { store, deployment }: { deployment: DatabaseIdentifier; store: Store },
  trx?: Knex.Transaction
) {
  const keyPair = secp256k1.binaryToHex(secp256k1.createKeyPair())
  await store.deploymentsecret.create(
    {
      data: {
        deployment,
        name: 'sextantKeypair',
        rawData: JSON.stringify(keyPair),
      },
    },
    trx
  )
  return keyPair
}

// load the sextant keypair for a deployment
export async function get(
  { store, deployment }: { deployment: DatabaseIdentifier; store: Store },
  trx?: Knex.Transaction
) {
  const secret = await store.deploymentsecret.get(
    {
      deployment,
      name: 'sextantKeypair',
    },
    trx
  )
  if (!secret) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug({ deployment }, 'no sextantKeypair found for deployment')
    return undefined
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  logger.trace({ deployment }, 'sextantKeypair fetched')
  return JSON.parse(base64.decode(secret.base64data).toString('utf8')) as secp256k1.KeyPairHex
}

// load the sextant keypair for a deployment
export async function getOrCreate(
  { store, deployment }: { deployment: DatabaseIdentifier; store: Store },
  trx?: Knex.Transaction
) {
  let secret = await get({ store, deployment }, trx)
  if (!secret) {
    secret = await create({ store, deployment }, trx)
  }
  return secret
}
