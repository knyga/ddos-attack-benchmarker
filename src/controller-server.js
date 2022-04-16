const Joi = require('joi')
const validator = require('express-joi-validation').createValidator({})
const express = require('express')
const { ResponseView } = require('./types')
const { Status, Type, cloneDefaultState } = require('./state')
const { getStats } = require('./stats')
const { startBenchmarkServer, stopBenchmarkServer } = require('./benchmark-servers')


const defaultResponseOptions = {
  code: 200,
  view: ResponseView.JSON,
}

function querySchema(joi) {
  return validator.query(Joi.object(joi))
}

function respond(resp, body, inputOptions = defaultResponseOptions) {
  const { code, view } = {
    ...defaultResponseOptions,
    ...inputOptions,
  }

  if (view === ResponseView.Text) {
    if(typeof body === 'object') {
      if (body.message) {
        return resp.status(code).send(body.message)
      } else if(body.data) {
        return resp.status(code).send(body.data)
      }
    }
    return resp.status(code).send(body.toString())
  }

  return resp.status(code).send({
    code,
    ...body,
  })
}

function respondBadRequest(resp, body, options = defaultResponseOptions) {
  return respond(resp, body, {
    code: 400,
    ...options,
  })
}

function respondNotFound(resp, body, options = defaultResponseOptions) {
  return respond(resp, body, {
    code: 404,
    ...options,
  })
}

function respondServerError(resp, err, options = defaultResponseOptions) {
  return respond(resp, { message: err ? err.message : null }, {
    code: 500,
    ...options,
  })
}

function startControllerServer(config) {
  let globalState = cloneDefaultState()
  function resetGlobalState() {
    globalState = cloneDefaultState()
  }

  const httpController = express()
  httpController.get('/start', querySchema({
    type: Joi.string().valid(...Object.values(Type)).required(),
    port: Joi.number().port().required(),
    duration: Joi.number().min(1).default(null),
    view: Joi.string().valid(...Object.values(ResponseView)).default(ResponseView.JSON),
  }), (req, res) => {
    const { type, port, duration, view } = req.query
    resetGlobalState()
    globalState.benchmarkServer.type = type
    globalState.benchmarkServer.port = port

    try {
      globalState.server = startBenchmarkServer(globalState, ({ code, message }) => {
        respond(res, { message }, { code, view })
        if (code !== 200) {
          resetGlobalState()
        }
      })

      if (duration) {
        setTimeout(() => stopBenchmarkServer(globalState), duration * 1000)
      }
    } catch (e) {
      respondServerError(res, e, { code, view })
      resetGlobalState()
    }
  })

  httpController.get('/stop', querySchema({
    view: Joi.string().valid(...Object.values(ResponseView)).default(ResponseView.JSON),
  }), (req, res) => {
    const { view } = req.query

    if (globalState.status !== Status.Started) {
      return respond(res, {message: 'Benchmark server was not started' }, { view })
    }

    try {
      stopBenchmarkServer(globalState, () => {
        const data = getStats(globalState, view)
        if (data === null) {
          return respondBadRequest(res, { message: 'No stats' }, { view })
        } else {
          return respond(res, { data }, { view })
        }
      })
    } catch (e) {
      respondServerError(res, e, { view })
    }
  })

  httpController.get('/stats', querySchema({
    view: Joi.string().valid(...Object.values(ResponseView)).default(ResponseView.JSON),
  }), (req, res) => {
    // TODO remove code duplication with stop
    const { view } = req.query

    try {
      const data = getStats(globalState, view)
      if (data === null) {
        return respondBadRequest(res, { message: 'No stats' }, { view })
      } else {
        return respond(res, { data }, { view })
      }
    } catch (e) {
      respondServerError(res, e)
    }
  })

  httpController.use(function (req, res) {
    return respondNotFound(res, { message: 'Not found' })
  })

  return httpController
    .listen(config.port, () => console.log(`HTTP Control API is listening on port ${config.port}${config.duration ? (' for ' + config.duration + ' seconds') : ''}`))
    .on('error', (err) => console.log(`HTTP Control API stopped with error ${err}`))
}

module.exports = {
  startControllerServer,
}
