
/**
 * @typedef {Object} Credentials
 * @prop {string} name
 * @prop {string} user
 */

/**
 * A helper function to access the authentication given by users in the proxy-authorization header.
 * @param {string} text
 * @returns {Credentials}  
 */

function Parse(text) {
    // Split the text in the middle and parse the base64 of the second part of the split result
    // Basic YWxhZGRpbjpvcGVuc2VzYW1l => YWxhZGRpbjpvcGVuc2VzYW1l
    const buffer = Buffer.from(text.split(' ')[1], 'base64'); 
    const string = buffer.toString();
    const split = string.split(':');

    return {
        name: split[0],
        pass: split[1]
    };
}

module.exports = Parse;