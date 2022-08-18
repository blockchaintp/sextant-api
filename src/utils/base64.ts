// get encoded base64 string of given data
export const encode = (data: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>) =>
  Buffer.from(data).toString('base64')
// get decoded buffer of base64 string
export const decode = (
  data:
    | WithImplicitCoercion<string>
    | {
        [Symbol.toPrimitive](hint: 'string'): string
      }
) => Buffer.from(data, 'base64')
// assume data type is a utf8 string
export const decodeToString = (data: string) => decode(data).toString('utf8')
