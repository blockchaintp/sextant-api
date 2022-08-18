const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')
const tmp = require('tmp')
const { writeYaml } = require('../utils/yaml')

const tempName = Promise.promisify(tmp.tmpName)

// eslint-disable-next-line no-unused-vars
const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

const formatData = ({ desired_state }) => {
  const initialData = desired_state

  if (initialData.sawtooth && initialData.sawtooth.customTPs) {
    const initialCustomTPs = initialData.sawtooth.customTPs

    const formattedCustomTPs = initialCustomTPs.map((tp) => ({
      // id: tp.id and index: tp.index values removed,
      name: tp.name,
      image: tp.image,
      command: tp.command ? tp.command.split(' ') : null,
      args: tp.args ? tp.args.split(' ') : null,
    }))

    initialData.sawtooth.customTPs = formattedCustomTPs
  }
  return initialData
}

/*
  write a yaml file
  to a temporary location
  merge custom yaml if it exists, otherwise use the merged values
  return the filepath to the new values.yaml
*/

const writeValues = async ({ desired_state, custom_yaml }) => {
  const valuesPath = await tempName({
    postfix: '.yaml',
  })

  const data = await formatData({
    desired_state,
  })

  let finalValuesYaml = data

  // parse string into yaml object
  const customYaml = yaml.safeLoad(custom_yaml)

  if (customYaml) {
    // merge yaml from the form input with custom yaml input
    finalValuesYaml = merge(data, customYaml, { arrayMerge: overwriteMerge })
  }

  writeYaml(valuesPath, finalValuesYaml)

  return valuesPath
}

module.exports = { writeValues }
