const { Etcd3 } = require('etcd3'),
    util = require('util'),
    path = require('path'),
    grpc = require('grpc'),
    PROTO_PATH = path.join(__dirname, 'rpc', 'hw.proto'),
    rpc_proto = grpc.load(PROTO_PATH).rpc;

// const client = new Etcd3({
//     hosts: ['172.20.9.101:2379', '172.20.9.103:2379', '172.20.9.105:2379']
// });
const prefix = 'etcd3_naming';
let serviceKey = null;
let _client;

let stopSignal = false;

async function register(name, host, port, target, interval, ttl) {
    let serviceValue = util.format('%s:%d', host, port);
    serviceKey = util.format('/%s/%s/%s', prefix, name, serviceValue);

    let client = new Etcd3({
        hosts: target.split(',')
    });
    _client = client;

    let lease = client.lease();
    lease.on('lost', err => {
        console.error('  ---> We lost our lease as a result of this error:', err);
        console.log('Trying to re-registry it...');
        register(name, host, port, target, interval, ttl);
    });
    let key = await client.get(serviceKey).string();
    let res = await lease.put(serviceKey).value(serviceValue);
    console.log('  ---> Res:', res);
    // let ticker = setInterval(() => {
    //     try {
    //         let lease = client.lease();
    //         let key = await client.get(serviceKey);
    //         console.log('  ---> Key: %s', key);
    //         await lease.put(serviceKey).value(serviceValue);
    //         // client.get(serviceKey).then(
    //         //     (key) => {
    //         //         console.log(key);
    //         //         if (key == null) {
    //         //             client.put(serviceKey).value(serviceValue).lease(ttl)
    //         //                 .then((id) => {
    //         //                     console.log('  ---> Registry Service with id: %s', id);
    //         //                 });
    //         //         } else {
    //         //             console.log('  ---> ServiceKey: %s, ServiceValue:%s has been registried to Etcd3.');
    //         //         }
    //         //     }
    //         // );

    //         if (stopSignal) {
    //             console.warn('  ---> Stop Signal received.');
    //             clearInterval(ticker);
    //             console.log('  ---> Ticker cleared.');
    //         }
    //     } catch (error) {
    //         console.error('  ---> Registry Service Failure!');
    //         clearInterval(ticker);
    //     }
    // }, interval);
}

function unregistry() {
    stopSignal = true;
    _client.delete().key(serviceKey)
        .then(() => {
            console.log('  ---> Service:%s is deleted.', serviceKey);
            process.exit(0);
        });
}


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

async function main() {
    await register('hello_service', '172.20.241.105', 50051, '172.20.9.101:2379,172.20.9.103:2379,172.20.9.105:2379', 10, 15);
    let server = new grpc.Server();
    let port = process.env.NODE_PORT || 50051;
    server.addService(rpc_proto.Greeter.service, { SayHello: sayHello, SayHelloAgain: sayHelloAgain });
    server.bind(`172.20.241.105:${port}`, grpc.ServerCredentials.createInsecure());
    server.start();
    console.log(`  ---> Server is running on 172.20.241.105:${port}`);
}

function unregistyService() {
    unregistry();
}

process.on('SIGINT', unregistyService).on('SIGTERM', unregistyService);

main();

// client.put('foo').value('bar')
//     .then(
//     () => client.get('foo').string()
//     )
//     .then(
//     val => console.log("foo was: ", val)
//     )
//     .then(
//     () => client.getAll().prefix('/etcd3_naming/hello_service').strings()
//     )
//     .then(
//     keys => console.log("all our keys starting with '/etcd3_naming/hello_service':", keys)
//     )

// client.put('foo').value('bar')
//   .then(() => client.get('foo').string())
//   .then(value => console.log('foo was:', value))
//   .then(() => client.getAll().prefix('f').strings())
//   .then(keys => console.log('all our keys starting with "f":', keys))
//   .then(() => client.delete().all());