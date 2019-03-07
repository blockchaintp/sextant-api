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
  knex.transaction(trx => {
    handler(trx, (err, results) => {
      if(err) {
        trx
          .rollback()
          .then(() => {
            done(err)
          })
          .catch((e) => {
            done(`error in transaction rollback callback: ${e.toString()}`)
          })
      }
      else {
        trx
          .commit()
          .then(() => {
            done(null, results)
          })
          .catch((e) => {
            trx
              .rollback()
              .then(() => {
                done(`error in transaction commit callback: ${e.toString()}`)
              })
          })
      }
    })  
  }).catch((e) => {
    done(`error in transaction: ${e.toString()}`)
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