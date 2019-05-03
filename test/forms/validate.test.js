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