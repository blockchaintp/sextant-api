import {
  ClusterFileCreateRequest,
  ClusterFileDeleteForClusterRequest,
  ClusterFileDeleteRequest,
  ClusterFileGetRequest,
  ClusterFileListRequest,
  ClusterFileReplaceRequest,
  ClusterFileUpdateRequest,
} from './clusterfile'

export type ClusterSecretCreateRequest = ClusterFileCreateRequest
export type ClusterSecretDeleteRequest = ClusterFileDeleteRequest
export type ClusterSecretDeleteForClusterRequest = ClusterFileDeleteForClusterRequest
export type ClusterSecretGetRequest = ClusterFileGetRequest
export type ClusterSecretListRequest = ClusterFileListRequest
export type ClusterSecretReplaceRequest = ClusterFileReplaceRequest
export type ClusterSecretUpdateRequest = ClusterFileUpdateRequest
