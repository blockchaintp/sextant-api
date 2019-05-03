'use strict'

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
  }]
}

tape('test basic validation fails', (t) => {
  t.ok(true, 'am here')
  validate({
    schema: forms.basic,
    data: {
      name: '',
    },
  }, (err) => {
    t.ok(err, `there was an error`)
    t.equal(err.toString(), 'ValidationError: The name is required', `the error text was correct`)
    t.end()
  })
})

tape('test basic validation passes', (t) => {
  t.ok(true, 'am here')
  validate({
    schema: forms.basic,
    data: {
      name: 'hello',
    },
  }, (err) => {
    t.not(err, `there was no error`)
    t.end()
  })
})


tape('test validator without required - no value', (t) => {
  t.ok(true, 'am here')
  validate({
    schema: forms.validateNoRequired,
    data: {
      url: '',
    },
  }, (err) => {
    t.notok(err, `there was no error`)
    t.end()
  })
})

tape('test validator without required - bad value', (t) => {
  t.ok(true, 'am here')
  validate({
    schema: forms.validateNoRequired,
    data: {
      url: 'apples',
    },
  }, (err) => {
    t.ok(err, `there was an error`)
    t.end()
  })
})