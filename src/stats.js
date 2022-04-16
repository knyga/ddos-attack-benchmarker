const { ResponseView } = require('./types')


function round(value, precision = 2) {
  const multiplier = 10 ** precision
  return Math.round(value * multiplier) / multiplier
}

function getJSONStats(state) {
  const upperBound = state.time.lastRequestAt || new Date()
  const { time: { firstRequestAt }, stats } = state
  if (firstRequestAt === null) {
    return null
  }

  const ms = upperBound.getTime() - firstRequestAt.getTime()
  const seconds = ms / 1000
  return {
    type: state.benchmarkServer.type,
    duration: {
      seconds: round(seconds),
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

function getTextStats(state) {
  const { type, duration, requests: { average: { perSecond }, total }} = getJSONStats(state)
  return `
Benchmark server type: ${type}
Execution duration (seconds): ${round(duration.seconds)}
Total request number: ${total.count}
Total received bytes: ${total.bytes}
Average number of requests per second: ${round(perSecond.count)}
Average number of received bytes per second: ${round(perSecond.bytes)}
`.trim()
}

function getStats(state, view = ResponseView.JSON) {
  if (view === ResponseView.Text) {
    return getTextStats(state)
  }

  return getJSONStats(state)
}

module.exports = {
  getStats,
  getJSONStats,
  getTextStats,
}
