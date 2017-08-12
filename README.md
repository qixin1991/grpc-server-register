# grpc-server-register

gRPC nodejs server register.

Dependencies:
- etcd3
- grpc

# Usage

```
const path = require('path'),
    grpc = require('grpc'),
    PROTO_PATH = path.join(__dirname, 'rpc', 'hw.proto'),
    rpc_proto = grpc.load(PROTO_PATH).rpc,
    register = require('./lib/register');

function sayHello(call, callback) {
    let params = call.request;
    console.log('  ---> Params: ', params);
    let res = {
        message: ' MSG from Node'
    }
    callback(null, res);
}

function sayHelloAgain(call, callback) {
    let params = call.request;
    let res = {
        message: ' MSG from Node Again'
    }
    callback(null, res);
}

const prefix = 'etcd3_naming';
async function main() {
    await register.registry(prefix,'hello_service', '172.20.241.105', 50051, '172.20.9.101:2379,172.20.9.103:2379,172.20.9.105:2379', 10, 15);
    let server = new grpc.Server();
    let port = process.env.NODE_PORT || 50051;
    server.addService(rpc_proto.Greeter.service, { sayHello: sayHello, sayHelloAgain: sayHelloAgain });
    server.bind(`172.20.241.105:${port}`, grpc.ServerCredentials.createInsecure());
    server.start();
    console.log(`  ---> Server is running on 172.20.241.105:${port}`);
}

function unregistyService() {
    register.unregistry();
}

process.on('SIGINT', unregistyService).on('SIGTERM', unregistyService);

main();
```