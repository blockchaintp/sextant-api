import { hash, compare } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { generate } from 'randomstring'
import * as config from '../config'
import { User } from '../store/model/model-types'

const { USER_TYPES, USER_ACCESS_LEVELS } = config

const SALT_ROUNDS = 10

export type SafeUser = Pick<User, 'id' | 'created_at' | 'username' | 'permission' | 'meta'>

export function safe(user: User): SafeUser {
  return {
    id: user.id,
    created_at: user.created_at,
    username: user.username,
    permission: user.permission,
    meta: user.meta,
  }
}

export function getPasswordHash(plainTextPassword: string) {
  return new Promise((resolve, reject) => {
    hash(plainTextPassword, SALT_ROUNDS, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}
export function compareHashedPasswords(plainTextPassword: string, hash: string) {
  return new Promise((resolve, reject) => {
    compare(plainTextPassword, hash, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

export function getTokenServerSideKey() {
  return generate(16)
}

// create the token given the username and server_side_key
export function getToken(id: string, serverSideKey: string, secret) {
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
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      }
    )
  })
}

export function decodeToken(token: string, secret) {
  return new Promise((resolve, reject) => {
    verify(token, secret, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

export function hasMinimumUserType(user: User, permission: string) {
  const userAccessLevel = USER_ACCESS_LEVELS[user.permission]
  const requiredAccessLevel = USER_ACCESS_LEVELS[permission]
  return userAccessLevel >= requiredAccessLevel
}

export const isSuperuser = (user: User) => hasMinimumUserType(user, USER_TYPES.superuser)
export const isAdminuser = (user: User) => hasMinimumUserType(user, USER_TYPES.admin)
