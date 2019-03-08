// get encoded base64 string of given data
const encode = (data) => new Buffer(data).toString('base64')
// get decoded buffer of base64 string
const decode = (data) => new Buffer(data, 'base64')
// assume data type is a utf8 string
const decodeToString = (data) => decode(data).toString('utf8')

module.exports = {
  encode,
  decode,
  decodeToString,
}