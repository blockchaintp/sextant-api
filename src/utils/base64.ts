// encode a buffer to base64 string
export function encode(data: string) {
  return Buffer.from(data).toString('base64')
}

// get decoded buffer of base64 string
export function decode(data: string) {
  return Buffer.from(data, 'base64')
}

export function decodeToString(data: string) {
  return decode(data).toString('utf8')
}
