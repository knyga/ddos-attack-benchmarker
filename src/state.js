const cloneDeep = require('lodash.clonedeep')


const Status = {
  Started: 'started',
  Stopped: 'stopped',
}

const Type = {
  TCP: 'tcp',
  UDP: 'udp',
  HTTP: 'http',
}

const defaultState = {
  status: Status.Stopped,
  server: null,
  time: {
    firstRequestAt: null,
    lastRequestAt: null,
  },
  benchmarkServer: {
    type: null,
    port: null,
  },
  stats: {
    requests: {
      total: {
        count: 0,
        bytes: 0,
      },
    }
  }
}

function cloneDefaultState() {
  return cloneDeep(defaultState)
}

module.exports = {
  Type,
  Status,
  defaultState,
  cloneDefaultState,
}
