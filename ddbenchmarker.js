#!/usr/bin/env node

const pm2 = require('pm2')
const path = require('path')

const { parser } = require('./src/args-parser')
const { startControllerServer } = require('./src/controller-server')

const config = parser.parse_args()

if (config.detach) {
  pm2.connect(function (err) {
    if (err) {
      console.error(err)
      process.exit(2)
    }

    pm2.start({
      script: path.join(__dirname, 'ddbenchmarker.js'),
      args: Object.entries(config).map(([key, value]) => ((key === 'detach' && value) || typeof value === 'undefined') ? '' : `--${key}=${value}`).join(' '),
      name: 'ddbenchmarker'
    }, function (err) {
      if (err) {
        console.error(err)
        return pm2.disconnect()
      }

      pm2.list(() => {
        pm2.restart('ddbenchmarker', (err, proc) => {
          pm2.disconnect()
        })
      })
    })
  })
} else {
  const server = startControllerServer(config)

  if (config.duration) {
    setTimeout(() => server.close(), config.duration * 1000)
  }
}