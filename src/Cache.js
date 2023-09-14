const EventEmitter = require('node:events');
    
/**
 * @typedef Options
 * @property {Number} ttl - Time to live of each cached object 
*/

/**
 * Class which implements a web Cache.
 * @extends EventEmitter
 */
class Cache extends EventEmitter {
    /**
     * 
     * @param {Options} options 
     */
    constructor(options = {}) {
        super();

        this.cache = {};
        this.options = Object.assign({
                ttl: options.ttl || 360000
            },
            options
        );
    }

    /**
     * Check if a key exists in the cache.
     * @param {string} key - The key to check for.
     * @returns {boolean} True if the key exists in the cache, false otherwise.
     */
    has(key) {
        return this.cache.hasOwnProperty(key);
    }

    /**
     * Get the cached value associated with a key.
     * @param {string} key - The key to retrieve the value for.
     * @returns {*} The cached value, or false if the key is not found.
     */
    get(key) {
        if (this.cache.hasOwnProperty(key)) return this.cache[key].value;
        else return false;
    }
    
    /**
     * Set a key-value pair in the cache.
     * @param {string} key - The key to set.
     * @param {*} value - The value to cache.
     */
    set(key, value) {
        this.cache[key.toString()] = { value, t: Date.now() + (this.options.ttl)};
        this.emit('set', key, value);
    }

    /**
     * Remove a key and its associated value from the cache.
     * @param {string} key - The key to remove.
     * @returns {boolean} True if the key was successfully removed, false if the key was not found.
     */
    remove(key) {
        this.emit('rem', key);
        if (this.cache.hasOwnProperty(key)) delete this.cache[key];
        else return false;
    }

    /**
     * Get an array of all keys currently stored in the cache.
     * @returns {string[]} An array of cache keys.
     */
    keys() {
        return Object.keys(this.cache);
    }

    /**
     * Remove expired cache entries.
     * @returns {void}
     */
    flush() {
        for (const key in this.cache) {
            if(this.cache[key].t <= Date.now()) {
                this.emit('rem');
                delete this.cache(key);
            }
        }
    }
}

module.exports = Cache;
