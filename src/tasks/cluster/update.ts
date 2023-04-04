import { saveAppliedState } from './utils/saveAppliedState'
import { Knex } from 'knex'
import { Store } from '../../store'
import * as model from '../../store/model/model-types'

type Options = {
  testMode: boolean
}

export const ClusterUpdate = ({ testMode }: Options) =>
  function* clusterUpdateTask(params: { store: Store; task: model.Task; trx: Knex.Transaction }) {
    const { store, task, trx } = params

    const id = task.resource_id

    // TODO: mock the kubectl handler for tests
    if (testMode) {
      yield saveAppliedState({
        id,
        store,
        trx,
      })
      return
    }

    yield saveAppliedState({
      id,
      store,
      trx,
    })
  }

module.exports = ClusterUpdate
