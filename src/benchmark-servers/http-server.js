const express = require('express')

function start(state, cb = () => { }) {
  const HTTPBenchmarkAPI = express()

  HTTPBenchmarkAPI.use(function (req, res) {
    const bytes = req.socket.bytesRead || req.get('content-length') || 0
    state.stats.requests.total.count += 1
    state.stats.requests.total.bytes += bytes

    if (state.time.firstRequestAt === null) {
      state.time.firstRequestAt = new Date()
    }
    state.time.lastRequestAt = new Date()

    res.status(200).send()
  })

  return HTTPBenchmarkAPI
    .listen(state.benchmarkServer.port, () => cb({
      code: 200,
      message: `HTTP Control API is listening on port ${state.benchmarkServer.port}`,
    }))
    .on('error', (err) => cb({
      code: 500,
      message: `HTTP Benchmark Server stopped with error ${err}`,
    }))
}

module.exports = {
  start,
}