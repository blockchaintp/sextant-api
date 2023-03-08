export function badRequest(res: any, error = 'The request was bad', code = 400) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  res.status(code).json({
    error,
  })
}
