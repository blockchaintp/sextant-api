const async = require('async')
// extracts the token and ca properties of the desired_state
// and saves them as clustersecrets before deleting those properties
// of the cluster record itself

const SecretExtractor = ({
  store,
  cluster,
  cancelSeries,
  transaction,
}, done) => cancelSeries([

  // if the provision type is remote
  // extract the token and ca and save them as clustersecrets
  next => {
    if(cluster.provision_type == 'local') return next()

    const {
      token,
      ca,
    } = cluster.desired_state

    async.parallel({
      token: nextp => {
        if(!token) return nextp()
        store.clustersecret.replace({
          data: {
            cluster: cluster.id,
            name: 'token',
            base64Data: token,
          },
          transaction,
        }, nextp)
      },

      ca: nextp => {
        if(!ca) return nextp()
        store.clustersecret.replace({
          data: {
            cluster: cluster.id,
            name: 'ca',
            base64Data: ca,
          },
          transaction,
        }, nextp)
      },

    }, next)
  },

  // if the cluster type is remote - delete the token and ca from the desired_state
  next => {
    if(cluster.provision_type == 'local') return next()

    const desired_state = Object.assign({}, cluster.desired_state)
    delete(desired_state.token)
    delete(desired_state.ca)

    store.cluster.update({
      id: cluster.id,
      data: {
        desired_state,
      },
      transaction,
    }, () => {
      return next(`test error`)
    })
  },

], done)

module.exports = SecretExtractor