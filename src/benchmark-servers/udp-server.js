const dgram = require('dgram')

const msgResponse = 'OK'


function start(state, cb = () => { }) {
  const UDPBenchmarkAPI = dgram.createSocket('udp4')
  UDPBenchmarkAPI
    .on('listening', () => cb({
      code: 200,
      message: `UDP Benchmark Server is listening on port ${state.benchmarkServer.port}`,
    }))
    .on('error', (err) => cb({
      code: 500,
      message: `UDP Benchmark Server stopped with error ${err}`,
    }))
    .on('message', (message, remote) => {
      if (state.time.firstRequestAt === null) {
        state.time.firstRequestAt = new Date()
      }
      state.stats.requests.total.bytes += Buffer.byteLength(message)
      state.stats.requests.total.count += 1
      state.time.lastRequestAt = new Date()

      UDPBenchmarkAPI.send(msgResponse, 0, msgResponse.length, remote.port, remote.address)
    })
  
  return UDPBenchmarkAPI.bind(state.benchmarkServer.port)
}

module.exports = {
  start,
}
