const { ArgumentParser } = require('argparse')


const parser = new ArgumentParser({
  description: 'HTTP/TCP/UDP server to generate benchmark for benchmark tools',
})
parser.add_argument('-p', '--port', {
  dest: 'port',
  type: 'int',
  default: 80,
  help: 'Port for HTTP Control API',
})
parser.add_argument('-l', '--duration', {
  dest: 'duration',
  type: 'int',
  help: 'Lifetime in seconds',
})
parser.add_argument('-d', '--detach', {
  dest: 'detach',
  action: 'store_true',
  default: false,
  help: 'Detach process from execution',
})
module.exports = {
  parser,
}
