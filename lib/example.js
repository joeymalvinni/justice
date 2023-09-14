const Proxy = require('../src/Proxy');

const proxy = new Proxy();

proxy.on('error', (err) => {
    console.error('Proxy encountered an error:', err);
});

proxy.on('close', () => {
    console.log('Client disconnected');
});

proxy.on('listen', (port, hostname) => {
    console.log(`Proxy server started up on ${port}:${hostname}`)
})

proxy.on('connection', (d) => {
    console.log(`Connection: ` + d.address);
})

proxy.listen('0.0.0.0', 80);