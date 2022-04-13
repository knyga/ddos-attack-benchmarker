// require('./src/index')
const { Status, Type } = require('./src/state')
const { parser } = require('./src/args-parser')
const { startControllerServer } = require('./src/controller-server')

const config = {
  port: 8080,
}

const parsed_args = parser.parse_args()

if (parsed_args.port) {
  config.port = parsed_args.port
}

startControllerServer(config)
