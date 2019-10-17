const { edition } = require('../edition')
const { Templates } = require('./templates')

const deployment = edition.deployment
const templates = new Templates(deployment.types)

module.exports = templates.get()
