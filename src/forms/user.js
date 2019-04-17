// base user form that operates in the following modes:

//  * initialUser
//    * the accessLevel is fixed to 'superuser' and not editable
//    * passwords are required
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
  
const UserForm = ({
  requirePasswords,
  accessLevelDisabled,
}) => {

  const getPasswordValidators = (title, extra = []) => {
    const requireValidators = requirePasswords ?
      [['required', title]] :
      []
    const baseValidators = [
      ['min', 6, 'Must be at least 6 characters'],
      ['matches', '^\\S+$', 'Cannot contain spaces'],
    ]
    return requireValidators.concat(baseValidators).concat(extra)
  }

  return [
    {
      id: 'username',
      title: 'Username',
      helperText: 'Enter your username',
      component: 'text',
      inputProps: {
        type: 'text',
      },
      validate: {
        type: 'string',
        methods: [
          ['matches', '^\\S+$', 'Cannot contain spaces'],
          ['min', 6, 'Must be at least 6 characters'],
          ['required', 'The username is required'], 
        ]
      }
    },
    {
      id: 'accessLevel',
      helperText: 'Access level',
      component: 'select',
      options: [{
        title: 'Superuser',
        value: 'superuser',
      },{
        title: 'Admin',
        value: 'admin',
      }, {
        title: 'User',
        value: 'user',
      }],
      extraProps: {
        disabled: accessLevelDisabled,
      }
    },
    {
      id: 'password',
      title: 'Password',
      helperText: 'Enter your password (min 6 chars - alphanumeric)',
      component: 'text',
      inputProps: {
        type: 'password',
      },
      validate: {
        type: 'string',
        methods: getPasswordValidators('The password is required'),
      }
    },
    {
      id: 'confirmPassword',
      title: 'Confirm Password',
      helperText: 'Confirm your password',
      component: 'text',
      inputProps: {
        type: 'password',
      },
      validate: {
        type: 'string',
        methods: getPasswordValidators(
          'The confirm password is required',
          [
            ['sameAs', 'password', 'Must be equal to password'],
          ]
        )
      }
    },
  ]
}

const userForms = {
  initialUser: UserForm({
    requirePasswords: true,
    accessLevelDisabled: true,
  }),
  userAdd: UserForm({
    requirePasswords: true,
    accessLevelDisabled: false,
  }),
  userEdit: UserForm({
    requirePasswords: false,
    accessLevelDisabled: false,
  }),
  userSelf: UserForm({
    requirePasswords: false,
    accessLevelDisabled: true,
  }),
}

module.exports = userForms