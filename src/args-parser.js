const { ArgumentParser } = require('argparse')

const parser = new ArgumentParser({
  description: 'HTTP/TCP/UDP server to generate benchmark for benchmark tools'
})
parser.add_argument('-p', '--port', {
  type: 'int',
  help: 'Port for HTTP Control API'
})

module.exports = {
  parser,
}
