import * as crypto from 'crypto'
export function string(n = 32) {
  if (n <= 0) {
    return ''
  }
  let rs = ''
  try {
    rs = crypto
      .randomBytes(Math.ceil(n / 2))
      .toString('hex')
      .slice(0, n)
    /* note: could do this non-blocking, but still might fail */
  } catch (ex) {
    /* known exception cause: depletion of entropy info for randomBytes */
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Exception generating random string: ${ex}`)
    /* weaker random fallback */
    rs = ''
    const r = n % 8,
      q = (n - r) / 8
    let i: number
    for (i = 0; i < q; i++) {
      rs += crypto.randomBytes(32).toString('hex').slice(2)
    }
    if (r > 0) {
      rs += crypto.randomBytes(32).toString('hex').slice(2, i)
    }
  }
  return rs
}
