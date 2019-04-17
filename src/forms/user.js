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

const validators = {
  username: () => [
    ['matches', '^\\S+$', 'Cannot contain spaces'],
    ['min', 3, 'Must be at least 3 characters'],
    ['required', 'The username is required'], 
  ],
  password: () => [
    ['min', 6, 'Must be at least 6 characters'],
    ['matches', '^\\S+$', 'Cannot contain spaces'],
  ],
  optionalPassword: () => validators.password(),
  requiredPassword: () => validators.password().concat([
    ['required', 'The password is required'],
  ])
}

const getUsernameField = () => ({
  id: 'username',
  title: 'Username',
  helperText: 'Enter your username',
  component: 'text',
  inputProps: {
    type: 'text',
  },
  validate: {
    type: 'string',
    methods: validators.username(),
  }
})

const getPasswordValidators = (required) => {
  return required ? 
    validators.requiredPassword() :
    validators.optionalPassword()
}

const getPasswordField = (required, title) => ({
  id: 'password',
  title: title || 'Password',
  helperText: 'Enter your password',
  component: 'text',
  inputProps: {
    type: 'password',
  },
  validate: {
    type: 'string',
    methods: getPasswordValidators(required)
  }
})
  
const UserForm = ({
  requirePasswords,
  accessLevelDisabled,
  passwordTitle,
}) => {
  return [
    getUsernameField(),
    {
      id: 'permission',
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
    getPasswordField(requirePasswords, passwordTitle),
    {
      id: 'confirmPassword',
      title: `Confirm ${passwordTitle || 'Password'}`,
      helperText: 'Confirm your password',
      component: 'text',
      inputProps: {
        type: 'password',
      },
      validate: {
        type: 'string',
        methods: getPasswordValidators(requirePasswords).concat([
          ['sameAs', 'password', 'Must be equal to password'],
        ])
      }
    },
  ]
}

const LoginForm = () => {
  return [
    getUsernameField(),
    getPasswordField(true),
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
    passwordTitle: 'Change Password',
  }),
  userSelf: UserForm({
    requirePasswords: false,
    accessLevelDisabled: true,
    passwordTitle: 'Change Password',
  }),
  login: LoginForm(),
}

module.exports = userForms