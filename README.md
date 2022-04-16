# DDOS Load Testing Server
HTTP/TCP/UDP server to generate benchmark for benchmark tools.

## Where to find benchmark tools
* https://github.com/denji/awesome-http-benchmark
* https://github.com/MatrixTM/MHDDoS
* https://github.com/alexmon1989/russia_ddos

## API

### Parts
1. HTTP Control API. It is started with process boot.
2. Benchmark Server. It is started with start request for HTTP Control API.

### HTTP Control API is REST API with methods
1. `HTTP GET /start/:type/:port/:duration?`. 
* Request resets Stats and boots up Server of Type on the Port. It changes Status to `Started`.
* If Status is not `Stopped` then it will return 400 HTTP code. Only one Server could run at the same time.
* If case of success then it will return 200 HTTP code.
* If Server can't be started then it will return 403 HTTP code.
* Duration is an optional param. It specifies lifetime of the Benchmark Server in seconds.
* Benchmark Server session start time (lower boundary) will correspond to the first request.
2. `HTTP GET /stop`.
* Request stops Stats accumulation, kills Server, and returns Stats. It changes Status to `Stopped`.
* If Status is not `Started` then it will return 400 HTTP code.
* If case of success it will return 200 HTTP code and Stats object.
3. `HTTP GET /stats`.
* Request returns latests Stats accumulation without changing State.
* If Status is not `Started` then it will return 400 HTTP code.
* If case of success it will return 200 HTTP code and Stats object.
* Benchmark Server session stop time (upper boundary) will correspond to the latests request.

### Object details
```typescript
enum Status {
  Started,
  Stopped,
}

enum Type {
  TCP = 'tcp',
  UDP = 'udp',
  HTTP = 'http',
}

interface Stats {
  type: Type,
  duration: {
    seconds: Number,
  },
  requests: {
    total: {
      count: Number,
      bytes: Number,
    },
    average: {
      perSecond: {
        count: Number,
        bytes: Number,
      },
    },
  },
}
```

## How to start

### Without Docker

#### Prerequisites
1. Node.js >= 14.17.6 and < 15.
2. NPM >= 6.14.15 and < 7.

#### Installation
`npm i`.

#### Start
To start HTTP Control API on port 8070: `npm run start -- -p 8070` or `node app -p 8070`.

#### Usage example
```bash
node app -p 8070 # start in separate process or daemon
curl http://localhost:8070/start/http/5555
# {"code":200,"message":"HTTP Control API is listening on port 5555"}
curl http://localhost:5555
curl http://localhost:5555
curl http://localhost:5555
curl http://localhost:8070/stop
# {"code":200,"message":"HTTP Control API is listening on port 5555"}{"code":200,"data":{"type":"http","duration":{"seconds":0},"requests":{"average":{"perSecond":{"count":null,"bytes":null}},"total":{"count":3,"bytes":234}}}}
```

#### Remarks
1. Default HTTP Control API port in 8080.
2. Access to some ports might require root permissions.
3. You can't start multiple servers of same type.

### With Docker
Docker is not implemented yet.

#### Prerequisites
Docker.

#### Start
To start HTTP Control API on port 8080 and preplanned exposed port (UDP) for Benchmark Server 8053: `docker run -it -p 8080:80/tcp -p 8053:53/udp --rm oknyga/ddos-attack-benchmarker:latest -p 80`.

#### Usage example
```bash
docker run -it -p 8080:80/tcp -p 5555:5555/tcp --rm oknyga/ddos-attack-benchmarker:latest -p 80 # start in separate process or daemon
curl http://localhost:8070/start/http/5555
# {"code":200,"message":"HTTP Control API is listening on port 5555"}
curl http://localhost:5555
curl http://localhost:5555
curl http://localhost:5555
curl http://localhost:8070/stop
# {"code":200,"message":"HTTP Control API is listening on port 5555"}{"code":200,"data":{"type":"http","duration":{"seconds":0},"requests":{"average":{"perSecond":{"count":null,"bytes":null}},"total":{"count":3,"bytes":234}}}}
```

#### Remarks
1. Same remarks as for Without Docker.
2. Plan ports you will be using ahead, read Published ports in Container networking documentation of the Docker: https://docs.docker.com/config/containers/container-networking/
