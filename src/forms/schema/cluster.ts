/* eslint-disable camelcase */
import Ajv, { JSONSchemaType } from 'ajv'
import ajvKeywords from 'ajv-keywords'
import ajvErrors from 'ajv-errors'
import { CERTIFICATE_PEM, URL_REGEXP } from './patterns'
import * as k8s from '@kubernetes/client-node'

const ajv = new Ajv({
  allErrors: true,
})
ajvKeywords(ajv)
ajvErrors(ajv)

export type ClusterAddRemoteForm = {
  capabilities?: { [key: string]: boolean }
  desired_state: {
    apiServer: string
    ca: string
    token: string
  }
  name: string
  provision_type: 'remote'
}

const clusterAddRemoteFormSchema: JSONSchemaType<ClusterAddRemoteForm> = {
  type: 'object',
  properties: {
    capabilities: {
      type: 'object',
      patternProperties: {
        '^.+$': { type: 'boolean' },
      },
      nullable: true,
      required: [],
    },
    desired_state: {
      type: 'object',
      properties: {
        apiServer: {
          type: 'string',
          regexp: URL_REGEXP,
        },
        ca: {
          type: 'string',
          pattern: CERTIFICATE_PEM,
        },
        token: {
          type: 'string',
        },
      },
      required: ['apiServer', 'ca', 'token'],
      additionalProperties: true,
      errorMessage: {
        apiServer: 'Must be a valid url with no trailing slash - e.g. http://apiserver.com',
        ca: 'Must be a valid certificate',
      },
    },
    name: {
      type: 'string',
    },
    provision_type: {
      type: 'string',
      enum: ['remote'],
    },
  },
  required: ['desired_state', 'name'],
  additionalProperties: false,
}

export type ClusterEditRemoteForm = {
  capabilities?: { [key: string]: boolean }
  desired_state: {
    apiServer: string
    ca?: string
    token?: string
  }
  name: string
  provision_type?: 'remote'
}

const clusterEditRemoteFormSchema: JSONSchemaType<ClusterEditRemoteForm> = {
  type: 'object',
  properties: {
    capabilities: {
      type: 'object',
      patternProperties: {
        '^.+$': { type: 'boolean' },
      },
      nullable: true,
      required: [],
    },
    desired_state: {
      type: 'object',
      properties: {
        apiServer: {
          type: 'string',
          regexp: URL_REGEXP,
        },
        ca: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        token: {
          type: 'string',
          nullable: true,
        },
      },
      additionalProperties: true,
      required: ['apiServer'],
      errorMessage: {
        apiServer: 'Must be a valid url with no trailing slash - e.g. http://apiserver.com',
        ca: 'Must be a valid certificate',
      },
    },
    name: {
      type: 'string',
    },
    provision_type: {
      type: 'string',
      nullable: true,
      enum: ['remote'],
    },
  },
  required: ['desired_state', 'name'],
  additionalProperties: false,
}

export type ClusterAddLocalForm = {
  capabilities: { [key: string]: boolean }
  desired_state: {
    apiServer?: string
    ca?: string
    token?: string
  }
  name: string
  provision_type: 'local'
}

const clusterAddLocalFormSchema: JSONSchemaType<ClusterAddLocalForm> = {
  type: 'object',
  properties: {
    capabilities: {
      type: 'object',
      patternProperties: {
        '^.+$': { type: 'boolean' },
      },
      required: [],
    },
    desired_state: {
      type: 'object',
      properties: {
        apiServer: {
          type: 'string',
          nullable: true,
          regexp: URL_REGEXP,
        },
        ca: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        token: {
          type: 'string',
          nullable: true,
        },
      },
      required: [],
      additionalProperties: true,
      errorMessage: {
        apiServer: 'Must be a valid url with no trailing slash - e.g. http://apiserver.com',
        ca: 'Must be a valid certificate',
      },
    },
    name: {
      type: 'string',
    },
    provision_type: {
      type: 'string',
      enum: ['local'],
    },
  },
  required: ['desired_state', 'name', 'provision_type'],
  additionalProperties: false,
}

export type ClusterEditLocalForm = {
  capabilities: { [key: string]: boolean }
  desired_state: {
    apiServer?: string
    ca?: string
    token?: string
  }
  name: string
  provision_type?: 'local'
}

const clusterEditLocalFormSchema: JSONSchemaType<ClusterEditLocalForm> = {
  type: 'object',
  properties: {
    capabilities: {
      type: 'object',
      patternProperties: {
        '^.+$': { type: 'boolean' },
      },
      required: [],
    },
    desired_state: {
      type: 'object',
      properties: {
        apiServer: {
          type: 'string',
          nullable: true,
          regexp: URL_REGEXP,
        },
        ca: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        token: {
          type: 'string',
          nullable: true,
        },
      },
      additionalProperties: true,
      required: [],
      errorMessage: {
        apiServer: 'Must be a valid url with no trailing slash - e.g. http://apiserver.com',
        ca: 'Must be a valid certificate',
      },
    },
    name: {
      type: 'string',
    },
    provision_type: {
      type: 'string',
      nullable: true,
      enum: ['local'],
    },
  },
  required: ['name'],
  additionalProperties: false,
}

export type ClusterAddUserForm = {
  cluster: Omit<k8s.Cluster, 'caFile'>
  provision_type: 'user'
  user: Omit<k8s.User, 'certFile' | 'keyFile' | 'exec' | 'authProvider'>
}

const clusterAddUserFormSchema: JSONSchemaType<ClusterAddUserForm> = {
  type: 'object',
  properties: {
    cluster: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        caData: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        server: {
          type: 'string',
          regexp: URL_REGEXP,
        },
        skipTLSVerify: {
          type: 'boolean',
          default: false,
        },
      },
      required: ['name', 'server'],
    },
    provision_type: {
      type: 'string',
      enum: ['user'],
    },
    user: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        certData: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        keyData: {
          type: 'string',
          nullable: true,
        },
        token: {
          type: 'string',
          nullable: true,
        },
        username: {
          type: 'string',
          nullable: true,
        },
        password: {
          type: 'string',
          nullable: true,
        },
      },
      required: ['name'],
    },
  },
  required: ['cluster', 'user', 'provision_type'],
}

export type ClusterEditUserForm = {
  cluster: Partial<Omit<k8s.Cluster, 'caFile'>>
  provision_type: 'user'
  user: Partial<Omit<k8s.User, 'certFile' | 'keyFile' | 'exec' | 'authProvider'>>
}

const clusterEditUserFormSchema: JSONSchemaType<ClusterEditUserForm> = {
  type: 'object',
  properties: {
    cluster: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          nullable: true,
        },
        caData: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        server: {
          type: 'string',
          regexp: URL_REGEXP,
          nullable: true,
        },
        skipTLSVerify: {
          type: 'boolean',
          nullable: true,
          default: false,
        },
      },
      required: [],
    },
    provision_type: {
      type: 'string',
      enum: ['user'],
    },
    user: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          nullable: true,
        },
        certData: {
          type: 'string',
          nullable: true,
          pattern: CERTIFICATE_PEM,
        },
        keyData: {
          type: 'string',
          nullable: true,
        },
        token: {
          type: 'string',
          nullable: true,
        },
        username: {
          type: 'string',
          nullable: true,
        },
        password: {
          type: 'string',
          nullable: true,
        },
      },
      required: [],
    },
  },
  required: ['provision_type'],
}

export const validators = {
  local: {
    add: ajv.compile(clusterAddLocalFormSchema),
    edit: ajv.compile(clusterEditLocalFormSchema),
  },
  remote: {
    add: ajv.compile(clusterAddRemoteFormSchema),
    edit: ajv.compile(clusterEditRemoteFormSchema),
  },
  user: {
    add: ajv.compile(clusterAddUserFormSchema),
    edit: ajv.compile(clusterEditUserFormSchema),
  },
}
