// save the desired_state to applied_state

import { Knex } from 'knex'
import { Store } from '../../../store'
import { DatabaseIdentifier } from '../../../store/model/scalar-types'

// this should be the last step of a task
export async function saveAppliedState({
  id,
  store,
  trx,
}: {
  id: DatabaseIdentifier
  store: Store
  trx?: Knex.Transaction
}) {
  const cluster = await store.cluster.get(
    {
      id,
    },
    trx
  )

  return store.cluster.update(
    {
      id,
      data: {
        applied_state: cluster.desired_state,
      },
    },
    trx
  )
}
