const { ArgumentParser } = require('argparse')


const parser = new ArgumentParser({
  description: 'HTTP/TCP/UDP server to generate benchmark for benchmark tools'
})
parser.add_argument('-p', '--port', {
  type: 'int',
  default: 80,
  help: 'Port for HTTP Control API'
})
parser.add_argument('-d', '--duration', {
  type: 'int',
  help: 'Lifetime in seconds'
})

module.exports = {
  parser,
}
