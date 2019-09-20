const getTemplates = require('@catenasys/sextant-ext-stl')

// pass the getTemplate function an array of strings (versions) to get templates for
const sawtooth = getTemplates(['1.0', '1.1'])

// export the templates
module.exports = sawtooth
