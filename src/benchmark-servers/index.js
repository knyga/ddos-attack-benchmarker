const { Status, Type } = require('../state')
const httpBenchmarkServer = require('./http-server')


function startBenchmarkServer(state, cb) {
  state.status = Status.Started

  const { type } = state.benchmarkServer
  switch (type) {
    case Type.HTTP: return httpBenchmarkServer.start(state, cb)
  }

  return cb({ code: 500, message: `Undefined type provided: ${type}` })
}

function stopBenchmarkServer(state, cb = () => { }) {
  state.status = Status.Stopped

  const { type } = state.benchmarkServer
  switch (type) {
    case Type.HTTP: {
      state.server.close()
      break
    }
  }

  // XXX Smelly
  setTimeout(cb, 1000)
}

module.exports = {
  stopBenchmarkServer,
  startBenchmarkServer,
}
