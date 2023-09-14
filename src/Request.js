/**
 * Represents an HTTP Request object that can be used to parse, construct, and manipulate HTTP requests.
 */

class Request {
    message;

    /**
     * @param {Object} string The request object as outputted by the `parse` function:
     *   - method: The HTTP method (e.g., GET, POST).
     *   - uri: The URI of the request.
     *   - protocol: The HTTP protocol (e.g., HTTP/1.1).
     *   - headers: An object containing HTTP headers as key-value pairs.
     *   - body: The message body of the request.
     */

    constructor(parsed) {
        this.message = parsed;
    }

    /**
     * Parses an HTTP request string and extracts the request method, URI, headers, and body.
     *
     * @param {string} message - The HTTP request string to parse.
     * @returns {Object} An object containing parsed request information:
     *   - method: The HTTP method (e.g., GET, POST).
     *   - hostname: The hostname of the request.
     *   - protocol: The HTTP protocol (e.g., HTTP/1.1).
     *   - headers: An object containing HTTP headers as key-value pairs.
     *   - body: The message body of the request.
     */

    static parse(message) {
        if (!message) return '';

        const lines = message.split(/\r?\n/);
        const requestLine = lines[0].trim().split(' ');
        const method = requestLine[0];
        const address = requestLine[1].split(':')[0];
        const port = requestLine[1].split(':')[1];
        const protocol = requestLine[2];

        const headers = {};
        for (let i = 1; i < lines.length; ++i) {
            let line = lines[i];

            if (line.trim() === '') {
                break;
            }

            let [name, value] = line.split(':');
            // Header field names made case-insensitive to be compliant with RFC 2616 (https://datatracker.ietf.org/doc/html/rfc2616#section-4.2)
            headers[name.trim().toLowerCase()] = value.trim();
        }

        const bodyStartIndex = message.indexOf('\r\n\r\n');
        const body = bodyStartIndex !== -1 ? message.substring(bodyStartIndex + 4) : '';

        return {
            method,
            address,
            port,
            protocol,
            headers,
            body
        }
    }

    /**
     * Converts the Request object to an HTTP request string.
     *
     * @returns {string} The HTTP request string representation of the Request object.
     */
    
    toString() {  
        const headersString = Object.keys(this.message.headers)
            .map((key) => `${key}: ${this.message.headers[key]}`)
            .join('\r\n');
        
        return `${this.message.method} ${this.message.address}:${this.message.port} ${this.message.protocol}\r\n${headersString}${this.message.body ? `\r\n\r\n${this.message.body}\r\n\r\n` : '\r\n\r\n'}`;
    }
}

module.exports = Request;