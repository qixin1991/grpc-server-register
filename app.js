const { Etcd3 } = require('etcd3');

const client = new Etcd3({
    hosts: ['172.20.9.101:2379', '172.20.9.103:2379', '172.20.9.105:2379']
});

client.put('foo').value('bar')
    .then(
    () => client.get('foo').string()
    )
    .then(
    val => console.log("foo was: ", val)
    )
    .then(
    () => client.getAll().prefix('/etcd3_naming/hello_service').strings()
    )
    .then(
    keys => console.log("all our keys starting with '/etcd3_naming/hello_service':", keys)
    )

// client.put('foo').value('bar')
//   .then(() => client.get('foo').string())
//   .then(value => console.log('foo was:', value))
//   .then(() => client.getAll().prefix('f').strings())
//   .then(keys => console.log('all our keys starting with "f":', keys))
//   .then(() => client.delete().all());