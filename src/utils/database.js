'use strict'

const getBody = (raw) => raw.result || raw.rows || raw
const getSingleRecord = (raw) => {
  raw = getBody(raw)
  raw = raw.constructor === Array ?
    raw[0] :
    raw
  return raw
}

const getAllRecords = (raw) => getBody(raw)

const extractor = (map) => (done) => (err, raw) => {
  if(err) return done(err)
  if(!raw) return done(null, null)
  done(null, map(raw))
}

const singleExtractor = extractor(getSingleRecord)
const allExtractor = extractor(getAllRecords)

const transaction = (knex, handler, done) => {

  let doneCalled = false
  let callbackReached = false
  const runDone = (err, result) => {
    if(doneCalled) return
    doneCalled = true
    done(err, result)
  }

  knex.transaction(trx => {
    handler(trx, (err, results) => {
      callbackReached = true
      if(err) {
        trx
          .rollback()
          .then(() => {
            runDone(err)
            return null
          })
          .catch((e) => {
            runDone(`error in transaction rollback callback: ${e.toString()}`)
          })
      }
      else {
        trx
          .commit()
          .then(() => {
            runDone(null, results)
            return null
          })
          .catch((e) => {
            trx
              .rollback()
              .then(() => {
                runDone(`error in transaction commit callback: ${e.toString()}`)
                return null
              })
          })
      }
    })  
  }).catch((e) => {
    if(!callbackReached) {
      runDone(`error in transaction: ${e.toString()}`)
    }
  })
}

module.exports = {
  getSingleRecord,
  getAllRecords,
  extractor,
  singleExtractor,
  allExtractor,
  transaction,
}