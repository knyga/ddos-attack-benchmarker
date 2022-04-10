const express = require('express')
const { ArgumentParser } = require('argparse')
const cloneDeep = require('lodash.clonedeep')

const config = {
  port: 8080,
}

//////////////////////////////////
////////Arguments parser//////////
//////////////////////////////////
const parser = new ArgumentParser({
  description: 'HTTP/TCP/UDP server to generate benchmark for benchmark tools'
})
parser.add_argument('-p', '--port', {
  type: 'int',
  help: 'Port for HTTP Control API'
})

const parsed_args = parser.parse_args()
if (parsed_args.port) {
  config.port = parsed_args.port
}


//////////////////////////////////
///////////////State//////////////
//////////////////////////////////
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
let globalState = cloneDeep(defaultState)

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
        perSeconds: {
          count: stats.requests.total.count / seconds,
          bytes: stats.requests.total.bytes / seconds,
        },
      },
      ...stats.requests,
    },
  }
}

function resetGlobalState() {
  globalState = cloneDeep(defaultState)
}
//////////////////////////////////
////////Benchmark Server//////////
//////////////////////////////////
function startHTTPBenchmarkServer(state, cb = () => {}) {
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
      code: 200,
      message: `HTTP Benchmark Server stopped with error ${err}`,
    }))
}

function startBenchmarkServer(state, cb) {
  globalState.status = Status.Started

  const { type } = state.benchmarkServer
  switch (type) {
    case Type.HTTP: return startHTTPBenchmarkServer(state, cb)
  }
  
  return cb({ code: 500, message: `Undefined type provided: ${type}`})
}

function stopBenchmarkServer(state, cb = () => {}) {
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

//////////////////////////////////
////////HTTP Control API//////////
//////////////////////////////////
const httpControlAPI = express()

// TODO add validation module, like joi
httpControlAPI.get('/start/:type/:port/:duration?', (req, res) => {
  const { type } = req.params
  const port = Number.parseInt(req.params.port)
  const duration = Number.parseInt(req.params.duration)
  if (globalState.status !== Status.Stopped) {
    return res.status(400).send({
      code: 400,
      message: 'Status should be Stopped before Start',
    })
  }
  if (!Object.values(Type).includes(type)) {
    return res.status(400).send({
      code: 400,
      message: `Provided ${type}, but allowed types are: ${Object.values(Type)}`,
    })
  }
  if(Number.isNaN(port) || port < 1) {
    return res.status(400).send({
      code: 400,
      message: `Port is not valid`,
    })
  }
  if (req.params.duration && (Number.isNaN(duration) || duration < 1)) {
    return res.status(400).send({
      code: 400,
      message: `Duration is not valid`,
    })
  }

  resetGlobalState()
  globalState.benchmarkServer.type = type
  globalState.benchmarkServer.port = port

  try {
    globalState.server = startBenchmarkServer(globalState, ({ code, message }) => {
      res.status(code).send({ code, message })
      if (code !== 200) {
        resetGlobalState()
      }
    })

    if (duration) {
      setTimeout(() => stopBenchmarkServer(globalState), duration * 1000)
    }
  } catch(e) {
    res.status(500).send({ code: 500, message: e.message })
    resetGlobalState()
  }
})

httpControlAPI.get('/stop', (req, res) => {
  if (globalState.status !== Status.Started) {
    res.status(400).send({ code: 400 })
  }

  try {
    stopBenchmarkServer(globalState, () => {
      const data = getStats(globalState)
      if (data === null) {
        // TODO refactor response formation
        res.status(200).send({ code: 400, message: 'No stats' })
      } else {
        res.status(200).send({
          code: 200,
          data,
        })
      }
    })
  } catch(e) {
    res.status(500).send({ code: 500, message: e.message })
  }
})

httpControlAPI.get('/stats', (req, res) => {
  try {
    const data = getStats(globalState)
    if (data === null) {
      // TODO refactor response formation
      res.status(200).send({ code: 400, message: 'No stats' })
    } else {
      res.status(200).send({
        code: 200,
        data,
      })
    }
  } catch (e) {
    res.status(500).send({ code: 500, message: e.message })
  }
})

httpControlAPI.use(function (req, res) {
  res.status(404).send({ code: 404, message: 'Not Found' })
})

httpControlAPI
  .listen(config.port, () => console.log(`HTTP Control API is listening on port ${config.port}`))
  .on('error', (err) => console.log(`HTTP Control API stopped with error ${err}`))
