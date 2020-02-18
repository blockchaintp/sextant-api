/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const { edition } = require('../edition')
const { TemplateLoader } = require('./templateLoader')

const deployment = edition.deployment
const templateLoader = new TemplateLoader(deployment.types)

module.exports = templateLoader.load()
