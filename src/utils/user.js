const safe = (user) => {
  return {
    username: user.username,
    type: user.type,
  }
}

module.exports = {
  safe,
}