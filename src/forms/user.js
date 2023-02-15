/* eslint-disable max-len */

// base user form that operates in the following modes:

//  * userAdd
//    * used by superadmin to add users
//    * passwords are required
//  * userEdit
//    * used by superadmin to edit users
//    * passwords are optional - if left blank, existing details are used
//  * userSelf
//    * used by logged in user to change password
//    * the accessLevel is not editable
//    * the accessLevel is fixed

// this is controlled by the following options

//   * requirePasswords
//   * accessLevelDisabled

const builder = require('./builder')

const validators = {
  noSpaces: ['matches', '^\\S+$', 'Cannot contain spaces'],
  min: (num) => ['min', num, `Must be at least ${num} characters`],
  sameAs: (field) => ['sameAs', field, `Must be equal to ${field}`],
}

const fields = {
  username: {
    id: 'username',
    title: 'Username',
    helperText: 'Enter your username',
    component: 'text',

    validate: {
      type: 'string',
      methods: [validators.noSpaces, validators.min(3)],
    },
  },
  changePassword: {
    id: 'changePassword',
    title: 'Change Password',
    component: 'formdialog',
    password: {
      id: 'password',
      title: 'Password',
      helperText: 'Enter your password',
      component: 'text',
      inputProps: {
        type: 'password',
      },
      validate: {
        type: 'string',
        methods: [validators.noSpaces, validators.min(6)],
      },
    },
    confirmPassword: {
      id: 'confirmPassword',
      title: 'Confirm Password',
      helperText: 'Confirm your password',
      component: 'text',
      inputProps: {
        type: 'password',
      },
      validate: {
        type: 'string',
        methods: [validators.noSpaces, validators.min(6), validators.sameAs('password')],
      },
    },
  },
  permission: {
    id: 'permission',
    title: 'Access Level',
    helperText: 'Choose the access level for this user',
    component: 'select',
    options: [
      {
        title: 'Superuser',
        value: 'superuser',
      },
      {
        title: 'Admin',
        value: 'admin',
      },
      {
        title: 'User',
        value: 'user',
      },
    ],
  },
}

const formRequired = {
  browser: {
    add: ['username', 'permission', 'password', 'confirmPassword'],
    edit: ['username', 'permission'],
  },
  server: {
    add: ['username', 'permission', 'password'],
    edit: [],
  },
}

const formSchema = {
  browser: ['username', 'permission', 'password', 'confirmPassword', 'changePassword'],
  server: ['username', 'permission', 'password'],
}

const getUserForm = ({ usernameDisabled, permissionDisabled, schema, required }) =>
  builder({
    fields,
    schema,
    required,
    mapField: (field) =>
      (field.id === 'permission' && permissionDisabled) || (field.id === 'username' && usernameDisabled)
        ? {
            ...field,
            extraProps: {
              disabled: true,
            },
          }
        : field,
  })

const forms = {
  browser: {
    userAdd: getUserForm({
      usernameDisabled: false,
      permissionDisabled: false,
      schema: formSchema.browser,
      required: formRequired.browser.add,
    }),
    userEdit: getUserForm({
      usernameDisabled: true,
      permissionDisabled: false,
      schema: formSchema.browser,
      required: formRequired.browser.edit,
    }),
    userSelf: getUserForm({
      usernameDisabled: true,
      permissionDisabled: true,
      schema: formSchema.browser,
      required: formRequired.browser.edit,
    }),
  },
  server: {
    add: getUserForm({
      permissionDisabled: false,
      schema: formSchema.server,
      required: formRequired.server.add,
    }),
    edit: getUserForm({
      permissionDisabled: false,
      schema: formSchema.server,
      required: formRequired.server.edit,
    }),
  },
}

module.exports = forms
