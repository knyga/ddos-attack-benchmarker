const { parser } = require('./src/args-parser')
const { startControllerServer } = require('./src/controller-server')

const config = parser.parse_args()
const server = startControllerServer(config)

if(config.duration) {
  setTimeout(() => server.close(), config.duration * 1000)
}
