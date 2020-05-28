const badRequest = (res, error = 'The request was bad', code = 400) => {
  res
    .status(code)
    .json({
      error,
    })
}

module.exports = {
  badRequest,
}