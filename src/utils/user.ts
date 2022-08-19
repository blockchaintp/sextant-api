import { hash as _hash, compare } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { generate } from 'randomstring'
import config from '../config'
import { DatabaseIdentifier, UserPermission } from '../store/domain-types'
import { UserEntity } from '../store/entity-types'

const { USER_TYPES, USER_ACCESS_LEVELS } = config

const SALT_ROUNDS = 10

type UnsafeUser = any
type SafeUser = Omit<UserEntity, 'hashed_password' | 'server_side_key'>

const safe = (user: UnsafeUser): SafeUser => ({
  id: user.id,
  created_at: user.created_at,
  username: user.username,
  permission: user.permission,
  meta: user.meta,
})

const getPasswordHash = (plainTextPassword: string) =>
  new Promise((resolve, reject) => {
    _hash(plainTextPassword, SALT_ROUNDS, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })

const compareHashedPasswords = (plainTextPassword: string, hash: string) =>
  new Promise((resolve, reject) => {
    compare(plainTextPassword, hash, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })

const getTokenServerSideKey = () => generate(16)

// create the token given the username and server_side_key
const getToken = (id: DatabaseIdentifier, serverSideKey: string, secret: string) => {
  if (!id) throw new Error(`id required to get token`)
  if (!serverSideKey) throw new Error(`server_side_key required to get token`)
  if (!secret) throw new Error(`secret required to get token`)
  return new Promise((resolve, reject) => {
    sign(
      {
        id,
        server_side_key: serverSideKey,
      },
      secret,
      (err: any, result: any) => {
        if (err) return reject(err)
        return resolve(result)
      }
    )
  })
}

const decodeToken = (token: string, secret: string) =>
  new Promise((resolve, reject) => {
    verify(token, secret, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })

const hasMinimumUserType = (user: SafeUser, permission: UserPermission) => {
  const userAccessLevel = USER_ACCESS_LEVELS[user.permission]
  const requiredAccessLevel = USER_ACCESS_LEVELS[permission]
  return userAccessLevel >= requiredAccessLevel
}

const isSuperuser = (user: SafeUser) => hasMinimumUserType(user, USER_TYPES.superuser)
const isAdminuser = (user: SafeUser) => hasMinimumUserType(user, USER_TYPES.admin)

export default {
  safe,
  getPasswordHash,
  compareHashedPasswords,
  getTokenServerSideKey,
  getToken,
  decodeToken,
  hasMinimumUserType,
  isSuperuser,
  isAdminuser,
}
