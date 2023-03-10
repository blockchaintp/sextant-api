/* eslint-disable camelcase */
import { USER_TYPES } from '../config'
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'

export const createRoleForResource = (
  {
    id,
    resource_type,
    user,
    username,
    permission,
  }: {
    id: DatabaseIdentifier
    permission: string
    resource_type: 'cluster' | 'deployment'
    user?: DatabaseIdentifier
    username?: string
  },
  store: Store
) => {
  if (!id) throw new Error(`id must be given to controller.${resource_type}.createRole`)
  if (!user && !username) throw new Error(`user or username must be given to controller.${resource_type}.createRole`)
  if (!permission) throw new Error(`permission must be given to controller.${resource_type}.createRole`)
  return store.transaction(async (trx) => {
    const userQuery: {
      id?: DatabaseIdentifier
      username?: string
    } = {}

    if (user) userQuery.id = user
    else if (username) userQuery.username = username

    const userRecord = await store.user.get(userQuery, trx)

    if (!userRecord) throw new Error('no user found')
    if (userRecord.permission === USER_TYPES.superuser) throw new Error('cannot create role for superuser')
    const existingRoles = await store.role.listForResource(
      {
        resource_type: resource_type,
        resource_id: id,
      },
      trx
    )

    const existingRole = existingRoles.find((role) => role.user === userRecord.id)

    if (existingRole) throw new Error(`this user already has a role for this ${resource_type} - delete it first`)

    return store.role.create(
      {
        data: {
          resource_type: resource_type,
          resource_id: id,
          user: userRecord.id,
          permission,
        },
      },
      trx
    )
  })
}
