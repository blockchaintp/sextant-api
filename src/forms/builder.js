/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const FormBuilder = ({
  fields,
  schema,
  required,
  mapField,
}) => {
  return schema.map(name => {
    const field = fields[name]
    const ret = JSON.parse(JSON.stringify(field))
    const validate = ret.validate || {
      type: 'string',
      methods: [],
    }
    if(required.indexOf(name) >= 0) {
      validate.methods = [['required', `${field.title} is required`]].concat(validate.methods)
    }
    ret.validate = validate
    return mapField ? mapField(ret) : ret
  })
}

module.exports = FormBuilder
