const { Etcd3 } = require('etcd3'),
    util = require('util');

let client, serviceKey, stopSignal = false;

module.exports = {

    registry: async function (prefix, name, host, port, target, interval, ttl) {
        let serviceValue = util.format('%s:%d', host, port);
        serviceKey = util.format('/%s/%s/%s', prefix, name, serviceValue);

        client = new Etcd3({
            hosts: target.split(',')
        });

        let lease = client.lease(ttl);
        await lease.put(serviceKey).value(serviceValue);
        lease.on('lost', err => {
            console.error('  ---> We lost our lease as a result of this error:', err);
            console.log('Trying to re-registry it...');
            register(prefix, name, host, port, target, interval, ttl);
            // unregistry();
        });
    },

    unregistry: function () {
        stopSignal = true;
        client.delete().key(serviceKey)
            .then(() => {
                console.log('  ---> Service:%s is deleted.', serviceKey);
                process.exit(0);
            });
    }

}