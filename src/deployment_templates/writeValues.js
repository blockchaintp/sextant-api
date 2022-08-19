const merge = require('deepmerge')
const tmpName = require('tmp-promise')
const { writeYaml, safeLoad } = require('../utils/yaml')

// eslint-disable-next-line no-unused-vars
const overwriteMerge = (destinationArray, sourceArray) => sourceArray

const formatData = ({ desired_state: desiredState }) => {
  const initialData = desiredState

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

const writeValues = async ({ desired_state: desiredState, custom_yaml: customYaml }) => {
  const valuesPath = await tmpName({
    postfix: '.yaml',
  })

  const data = await formatData({
    desired_state: desiredState,
  })

  let finalValuesYaml = data

  // parse string into yaml object
  const parsedYaml = safeLoad(customYaml)

  if (parsedYaml) {
    // merge yaml from the form input with custom yaml input
    finalValuesYaml = merge(data, parsedYaml, { arrayMerge: overwriteMerge })
  }

  writeYaml(valuesPath, finalValuesYaml)

  return valuesPath
}

module.exports = { writeValues }
