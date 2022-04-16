// Sends single UDP package to destination
// Usage example is node udp.js -p 8053 -l localhost
const dgram = require('dgram')
const { ArgumentParser } = require('argparse')


const parser = new ArgumentParser({
  description: 'UDP client'
})
parser.add_argument('-l', '--host', {
  type: 'str',
  default: '127.0.0.1',
  help: 'Host for UDP connection'
})
parser.add_argument('-p', '--port', {
  type: 'int',
  default: 5555,
  help: 'Port for UDP connection'
})
parser.add_argument('-m', '--message', {
  type: 'str',
  default: 'I am Thor!',
  help: 'Message for UDP package'
})
const parsed_args = parser.parse_args()
const message = new Buffer(parsed_args.message)
const client = dgram.createSocket('udp4')
client.send(message, 0, message.length, parsed_args.port, parsed_args.host, function (err, bytes) {
  if (err) {
    throw err
  }
  console.log(`UDP client message sent to ${parsed_args.host}:${parsed_args.port}`, bytes)

})
client.on('message', function (message, remote) {
  console.log(`${remote.address}:${remote.port} - ${message}`)
  client.close()
})
