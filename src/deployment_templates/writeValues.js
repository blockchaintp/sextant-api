const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')
const tmp = require('tmp')

const writeFile = Promise.promisify(fs.writeFile)
const tempName = Promise.promisify(tmp.tmpName)

const pino = require('pino')({
  name: 'writeValues.js',
})

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

const writeYaml = async (filepath, data) => {
  const yamlText = yaml.safeDump(data)
  return writeFile(filepath, yamlText, 'utf8')
}

const formatData = async ({
  desired_state,
}) => {

  const initialData = desired_state

  if (initialData.sawtooth && initialData.sawtooth.customTPs) {
    const initialCustomTPs = initialData.sawtooth.customTPs

    const formatedCustomTPs = initialCustomTPs.map((tp) => {
      return {
        // id: tp.id and index: tp.index values removed,
        name: tp.name,
        image: tp.image,
        command: tp.command.split(' '),
        args: tp.args.split(' '),
      }
    })

    initialData.sawtooth.customTPs = formatedCustomTPs
  }
  const formatedData = initialData

  return formatedData
}


/*
  write a yaml file
  to a temporary location 
  merge custom yaml if it exists, otherwise use the merged values
  return the filepath to the new values.yaml
*/


const writeValues = async ({
  desired_state,
  custom_yaml
}) => {
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

  await writeYaml(valuesPath, finalValuesYaml)

  return valuesPath
}

module.exports = { writeValues }