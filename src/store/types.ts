export type DatabaseIdentifier = number

export type IDBasedRequest = {
  id: DatabaseIdentifier
}

export type ClusterStoreOptions = {
  deleted?: boolean
}

export type ClusterCreateRequest = {
  data: {
    name: string
    provision_type: 'local' | 'remote'
    capabilities: {
      [key: string]: boolean
    }
    desired_state: any
  }
}

export type ClusterUpdateRequest = {
  id: DatabaseIdentifier
  data: any
}
