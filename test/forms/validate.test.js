/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const asyncTest = require('../asyncTest')
const tape = require('tape')

const validate = require('../../src/forms/validate')

const forms = {
  basic: [{
    id: 'name',
    title: `Name`,
    helperText: 'Enter the name of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        ['required', 'The name is required'],
      ],
    }
  }],
  validateNoRequired: [{
    id: 'url',
    title: `Url`,
    helperText: 'Enter the url of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        ['url', 'Must be a valid url - e.g. http://apiserver.com'],
      ],
    }
  }],
  ca: [{
    id: 'ca',
    title: `Ca`,
    helperText: 'Enter the ca of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        [
          'matches',
          ['^-----BEGIN CERTIFICATE-----.*-----END CERTIFICATE-----$', 's'],
          'Must be a valid certificate'
        ]
      ],
    }
  }]
}

asyncTest('test basic validation fails', async (t) => {

  let error = null

  try {
    await validate({
      schema: forms.basic,
      data: {
        name: '',
      },
    })
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
  t.equal(error.toString(), 'Error: name validation error: the name is required', `the error text was correct`)
})

asyncTest('test basic validation passes', async (t) => {
  await validate({
    schema: forms.basic,
    data: {
      name: 'hello',
    },
  })
})


asyncTest('test validator without required - no value', async (t) => {
  await validate({
    schema: forms.validateNoRequired,
    data: {
      url: '',
    },
  })
})

asyncTest('test validator without required - bad value', async (t) => {

  let error = null

  try {
    await validate({
      schema: forms.validateNoRequired,
      data: {
        url: 'apples',
      },
    })
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
})

asyncTest('test validator with multiline value', async (t) => {
  await validate({
    schema: forms.ca,
    data: {
      ca: "-----BEGIN CERTIFICATE-----\n\n\n-----END CERTIFICATE-----",
    },
  })
})
