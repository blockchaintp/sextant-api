const yup = require('yup')
const dotty = require('dotty')
const bluebird = require('bluebird')

const {
  array,
  object,
  string,
  number,
  ref,
} = yup

const validators = {
  array,
  object,
  string,
  number,
}

// turn JSON values for validation functions into the actual type
// for example, turn string.match -> regular expression string into RegExp object
const validateArgsMappers = {
  string: (method, args) => {
    if(method == 'matches') {
      return args.map((arg, i) => {
        if(i == 0) {
          // if given '^\w+\d' assume a regexp with no flags
          // if given ['^\w+\d', 'i'] then we have some flags
          if(typeof(arg) === 'string') {
            return new RegExp(arg)
          }
          else {
            return new RegExp(arg[0], arg[1])
          }
        }
        else {
          return arg
        }
      })
    }
    else {
      return args
    }
  },
  number: (method, args) => {
    return args
  },
}

const validateHandlers = {
  string: {
    sameAs: (validateObject, args) => {
      const [ matchField, message ] = args
      return validateObject.oneOf([ref(matchField), null], message || `Must be equal to ${matchField}`)
    },
  }
}

/*
    
  loop over each of the method args and apply them in a chain

  return a flat object with dot notation fields

  e.g. 

  {
    type: 'string',
    methods: [
      ['required', 'The password is required'],
      ['min', 6, 'Must be at least 6 characters'],
      ['matches', '^\\S+$', 'Cannot contain spaces'],
      ['sameAs', 'otherField', 'Must be the same as otherField'],
    ]
  }

  becomes:

  yup
    .string()
    .required('The password is required')
    .min(6, 'Must be at least 6 characters')
    .matches(/^\\S+$/, 'Cannot contain spaces')
    .oneOf([yup.ref('otherField'), null], 'Must be the same as otherField')

  we run each of the method arguments through a mapper
  this is because we can only store the method config as JSON so things
  like RegExps need turning into actual arguments

  also - there are special case handlers (for example oneOf) that use a
  function to call methods on the existing validate object

*/
const reduceValidateMethods = (validateType, baseType, validateMethods) => {
  return (validateMethods || []).reduce((validateObject, validateArgs) => {
    const methodName = validateArgs[0]
    const methodArgs = validateArgs.slice(1)
    const argsMapper = validateArgsMappers[validateType]
    const applyMethodArgs = argsMapper ? argsMapper(methodName, methodArgs) : methodArgs

    const validateHandler = (validateHandlers[validateType] || {})[methodName]

    if(validateHandler) {
      return validateHandler(validateObject, applyMethodArgs)
    }
    else {
      return validateObject[methodName].apply(validateObject, applyMethodArgs)
    }
  }, baseType)
}



const getFlatValidationSchema = (schema) => {
  return schema.reduce((all, item) => {
    if(!item.validate) return all

    if(item.list) {
      const subSchema = getValidationSchema(item.list)
      const baseType = array().of(subSchema)
      const validateMethods = item.validate && item.validate.methods
      all[item.id] = reduceValidateMethods('array', baseType, validateMethods)
      return all
    }

    const validateType = item.validate.type
    const validateTypeFunction = validators[validateType]
    if(!validateTypeFunction) throw new Error(`unknown validate type for field: ${item.id}: ${validateType}`)
    all[item.id] = reduceValidateMethods(validateType, validateTypeFunction(), item.validate.methods)
    return all
  }, {})
}

/*

  turn all plain objects into yup.objects recursively

*/
const processValidationObject = (obj) => {
  if(obj.constructor !== Object) return obj
  const processedObj = Object.keys(obj).reduce((all, key) => {
    all[key] = processValidationObject(obj[key])
    return all
  }, {})
  return object(processedObj)
}

const flattenSchema = (schema) => {
  return schema.reduce((all, row) => {
    return row.constructor === Array ?
      all.concat(row) :
      all.concat([row])
  }, [])
}

/*

  turn a flat array of validation fields
  into a nested yup object structure

*/
const getValidationSchema = (schema) => {
  const flatValidationSchema = getFlatValidationSchema(flattenSchema(schema))

  const nestedSchema = Object.keys(flatValidationSchema).reduce((all, key) => {
    const validator = flatValidationSchema[key]
    dotty.put(all, key, validator)
    return all
  }, {})

  const finalSchema = Object.keys(nestedSchema).reduce((all, key) => {
    all[key] = processValidationObject(nestedSchema[key])
    return all
  }, {})

  return object(finalSchema)
}

const validate = ({
  schema,
  data,
}, done) => {
  const validateSchema = getValidationSchema(schema)
  const p = validateSchema
    .validate(data)
    .catch(err => {
      const errorString = 
        `${err.path} ${err.toString()}`
          .toLowerCase()
          .replace('validationerror', 'validation error')
      throw(errorString)
    })
  bluebird
    .resolve(p)
    .asCallback(err => {
      if(err) return done(err)
      return done(null, true)
    })
}

module.exports = validate