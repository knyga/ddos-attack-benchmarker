const { Status, Type } = require('../state')
const httpBenchmarkServer = require('./http-server')
const tcpBenchmarkServer = require('./tcp-server')
const udpBenchmarkServer = require('./udp-server')


function startBenchmarkServer(state, cb) {
  state.status = Status.Started
  const { type } = state.benchmarkServer
  switch (type) {
    case Type.HTTP: return httpBenchmarkServer.start(state, cb)
    case Type.TCP: return tcpBenchmarkServer.start(state, cb)
    case Type.UDP: return udpBenchmarkServer.start(state, cb)
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
    case Type.TCP: {
      state.server.close()
      break
    }
    case Type.UDP: {
      state.server.close()
      break
    }
    default: return cb({ code: 500, message: `Undefined type provided: ${type}` })
  }

  // XXX Smelly
  setTimeout(cb, 1000)
}

module.exports = {
  stopBenchmarkServer,
  startBenchmarkServer,
}
