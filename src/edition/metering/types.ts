export type MeteringSpec<U> = {
  type: string
} & U

export type AWSMeteringSpec = MeteringSpec<{
  productCode: string
  publicKeyVersion: number
}>
