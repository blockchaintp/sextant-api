import { ClusterFile } from '../model/model-types'
import { DatabaseIdentifier } from '../model/scalar-types'

export type ClusterFileCreateRequest = {
  data: Pick<ClusterFile, 'cluster' | 'name'> & Partial<Pick<ClusterFile, 'base64data'>> & { rawData?: string }
}

export type ClusterFileDeleteRequest = {
  cluster: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export type ClusterFileDeleteForClusterRequest = {
  cluster: DatabaseIdentifier
}

export type ClusterFileGetRequest = {
  cluster: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export type ClusterFileListRequest = {
  cluster: DatabaseIdentifier
}

export type ClusterFileReplaceRequest = {
  data: Pick<ClusterFile, 'cluster' | 'name'> & Partial<Pick<ClusterFile, 'base64data'>> & { rawData?: string }
}

export type ClusterFileUpdateRequest = {
  cluster: DatabaseIdentifier
  data: { base64data?: string; rawData?: string }
  id?: DatabaseIdentifier
  name?: string
}
