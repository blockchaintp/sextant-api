const TaskProcessor = require('../src/taskprocessor')

const getTaskProcessor = ({
  store,
  handlers,
}) => {
  return TaskProcessor({
    store,
    handlers: handlers || {},
  })
}

module.exports = getTaskProcessor
