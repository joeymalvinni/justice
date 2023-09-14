const net = require('node:net');
const EventEmitter = require('node:events');
const Request = require('./Request');
const ParseAuth = require('./ParseAuth');
const Cache = require('./Cache');

/**
 * @typedef {Object} Options
 * @property {function(): boolean} auth - The authentication function. Defaults to () => true.
 * @property {function(): boolean} blacklist - The blacklist function. Defaults to () => false.
 * @property {Number} timeout - The timeout value in milliseconds. Defaults to 10000.
 */

/**
 * Represents a proxy server that handles incoming connections.
 * @extends EventEmitter
 */
class ProxyServer extends EventEmitter {
    /**
     * Create a new ProxyServer instance.
     * @param {Options} options - An options object which can hold the auth, blacklist, and timeout variables.
     */
    constructor(options) {
        super();

        options = Object.assign({
                timeout: 100000,
                auth: () => true,
                blacklist: () => false
            },
            options
        );

        this.blacklist = options.blacklist;
        this.auth = options.auth;
        this.timeout = options.timeout;

        this.cache = new Cache();

        this.server = net.createServer();
        this.server.on('connection', this.handleConnection.bind(this));
        this.server.on('error', this.handleError.bind(this));
        this.server.on('close', this.handleClose.bind(this));
    }

    /**
     * Start listening for incoming connections on the specified hostname and port.
     * @param {string} hostname - The hostname to bind the server to.
     * @param {number} port - The port to listen on.
     */
    listen(hostname, port) {
        this.server.listen({
            host: hostname,
            port: port
        }, () => {
            this.emit('listen', hostname, port);
        });
    }

    /**
     * Handles incoming socket connections.
     * @param {net.Socket} socket - The incoming socket connection.
     */
    handleConnection(socket) {
        socket.once('data', (req) => {
            const data = req.toString();
            const tls = data.includes('CONNECT');
            const parsed = Request.parse(data);
            const port = tls ? 443 : 80;
            const address = tls ? parsed.address : parsed.headers.Host;

            this.emit('connection', parsed);

            if (this.blacklist(address)) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\nNot found.');
                socket.end();
                return;
            }

            const header = parsed.headers['proxy-authorization'];

            // No proxy-authentication headers
            if (!header) {
                socket.write('HTTP/1.1 407 Unauthorized\r\nProxy-Authenticate: Basic realm="Proxy Authentication"\r\n\r\nAccess denied');
                socket.end();
                return;
            }

            // Validate proxy-authenticate headers
            const {name, pass} = ParseAuth(header);

            if (!this.auth(name, pass)) {
                socket.write('HTTP/1.1 407 Unauthorized\r\nProxy-Authenticate: Basic realm="Proxy Authentication"\r\n\r\nAccess denied');
                socket.end();
                return;
            }

            const cachedResponse = this.cache.get(tls ? null : address);

            if (cachedResponse) {
                socket.write(cachedResponse);
                socket.end();
                return;
            }

            const proxy = net.createConnection({
                host: address,
                port,
                timeout: this.timeout
            });

            const message = new Request(parsed);

            if (tls) {
                socket.write('HTTP/1.1 200 OK\r\n\r\n');
            } else {
                proxy.write(message.toString());
            }

            socket.pipe(proxy);
            proxy.pipe(socket);

            proxy.on('data', (data) => {
                if (!tls) this.cache.set(address, data.toString());
            })

            socket.on('error', (err) => {
                this.emit('error', err)
                console.log('Client to proxy error ', err);
            });

            proxy.on('error', (err) => {
                this.emit('error', err);
                if (err.code === 'ECONNREFUSED') {
                    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
                    socket.write(`<html><body><h1>502 Bad Gateway</h1><p>Proxy encountered an error: ${err.code} ${err.message}</p></body></html>`);
                    socket.end();
                    return;
                }
                console.log('Proxy to server error ', err);
            });
        });
    }

    handleError(err) {
        this.emit('error', err);
    }

    handleClose() {
        this.emit('close');
    }
}

module.exports = ProxyServer;