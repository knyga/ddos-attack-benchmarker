const express = require('express')


function start(state, cb = () => { }) {
  const HTTPBenchmarkAPI = express()
  const connections = new Map()
  HTTPBenchmarkAPI.use(function (req, res) {
    const { socket: { bytesRead, connectionIndex }} = req
    const connectionBytes = bytesRead || 0
    if (!connections.has(connectionIndex)) {
      connections.set(connectionIndex, 0)
    }
    state.stats.requests.total.count += 1
    state.stats.requests.total.bytes += connectionBytes - connections.get(connectionIndex)

    if (state.time.firstRequestAt === null) {
      state.time.firstRequestAt = new Date()
    }
    state.time.lastRequestAt = new Date()

    connections.set(connectionIndex, connectionBytes)
    res.status(200).send()
  })

  let connectionIndex = 0
  return HTTPBenchmarkAPI
    .listen(state.benchmarkServer.port, () => cb({
      code: 200,
      message: `HTTP Benchmark Server is listening on port ${state.benchmarkServer.port}`,
    }))
    .on('connection', (socket) => {
      connectionIndex += 1
      socket.connectionIndex = connectionIndex
    })
    .on('error', (err) => cb({
      code: 500,
      message: `HTTP Benchmark Server stopped with error ${err}`,
    }))
}

module.exports = {
  start,
}