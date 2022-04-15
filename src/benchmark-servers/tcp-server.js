const Net = require('net')


function start(state, cb = () => { }) {
  const TCPBenchmarkAPI = new Net.Server()
  TCPBenchmarkAPI.on('connection', (socket) => {
    socket.write(`HTTP/1.1 200 OK
Content-Length: 13
Content-Type: text/plain; charset=utf-8

{"code":200}`)
    socket.on('data', (chunk) => {
      if (state.time.firstRequestAt === null) {
        state.time.firstRequestAt = new Date()
      }
      state.stats.requests.total.bytes += Buffer.byteLength(chunk)
      state.stats.requests.total.count += 1
      state.time.lastRequestAt = new Date()
    })
    socket.on('error', () => {})
    socket.on('close', () => {})
  })
  return TCPBenchmarkAPI
    .listen(state.benchmarkServer.port, () => cb({
      code: 200,
      message: `TCP Benchmark Server is listening on port ${state.benchmarkServer.port}`,
    }))
    .on('error', (err) => cb({
      code: 500,
      message: `TCP Benchmark Server stopped with error ${err}`,
    }))
}

module.exports = {
  start,
}
