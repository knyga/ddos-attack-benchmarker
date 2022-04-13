const cloneDeep = require('lodash.clonedeep')

const Status = {
  Started: Symbol('Started'),
  Stopped: Symbol('Stopped'),
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

function getStats(state) {
  const upperBound = state.time.lastRequestAt || new Date()
  const { time: { firstRequestAt }, stats } = state
  if (firstRequestAt === null) {
    return null
  }

  const ms = upperBound.getTime() - firstRequestAt.getTime()
  const seconds = Math.floor(ms / 1000)
  return {
    type: state.benchmarkServer.type,
    duration: {
      seconds,
    },
    requests: {
      average: {
        perSecond: {
          count: stats.requests.total.count / seconds,
          bytes: stats.requests.total.bytes / seconds,
        },
      },
      ...stats.requests,
    },
  }
}

module.exports = {
  Type,
  Status,
  getStats,
  defaultState,
  cloneDefaultState,
}
