const Joi = require('joi')
const validator = require('express-joi-validation').createValidator({})
const express = require('express')
const { Status, Type, cloneDefaultState, getStats } = require('./state')
const { startBenchmarkServer, stopBenchmarkServer } = require('./benchmark-servers')

function paramsSchema(joi) {
  return validator.params(Joi.object(joi))
}

function respond(resp, body) {
  const code = body.code || 200
  return resp.status(code).send({
    code,
    ...body,
  })
}

function respondServerError(resp, err) {
  const code = 500
  return respond(resp, { code, message: err ? err.message : null })
}

function startControllerServer(config) {
  let globalState = cloneDefaultState()
  function resetGlobalState() {
    globalState = cloneDefaultState()
  }

  const httpController = express()
  httpController.get('/start/:type/:port/:duration?', paramsSchema({
    type: Joi.string().valid(...Object.values(Type)).required(),
    port: Joi.number().port().required(),
    duration: Joi.number().min(1),
  }), (req, res) => {
    const { type, port, duration } = req.params
    resetGlobalState()
    globalState.benchmarkServer.type = type
    globalState.benchmarkServer.port = port

    try {
      globalState.server = startBenchmarkServer(globalState, ({ code, message }) => {
        respond(res, { code, message })
        if (code !== 200) {
          resetGlobalState()
        }
      })

      if (duration) {
        setTimeout(() => stopBenchmarkServer(globalState), duration * 1000)
      }
    } catch (e) {
      respondServerError(res, e)
      resetGlobalState()
    }
  })

  httpController.get('/stop', (req, res) => {
    if (globalState.status !== Status.Started) {
      return respond(res, { code: 400, message: 'Benchmark server was not started' })
    }

    try {
      stopBenchmarkServer(globalState, () => {
        const data = getStats(globalState)
        if (data === null) {
          return respond(res, { code: 400, message: 'No stats' })
        } else {
          return respond(res, { data })
        }
      })
    } catch (e) {
      respondServerError(res, e)
    }
  })

  httpController.get('/stats', (req, res) => {
    try {
      const data = getStats(globalState)
      if (data === null) {
        return respond(res, { code: 400, message: 'No stats' })
      } else {
        return respond(res, { data })
      }
    } catch (e) {
      respondServerError(res, e)
    }
  })

  httpController.use(function (req, res) {
    return respond(res, { code: 404, message: 'Not found' })
  })

  return httpController
    .listen(config.port, () => console.log(`HTTP Control API is listening on port ${config.port}`))
    .on('error', (err) => console.log(`HTTP Control API stopped with error ${err}`))
}

module.exports = {
  startControllerServer,
}
