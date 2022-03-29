const axios = require('axios');
/**
 * @typedef import('axios').AxiosResponse AxiosResponse
 */

/**
 * # 🕸 Basic HTTP API Client
 *
 * HTTP interfaces
 *
 * Interfaces are based on Axios. Provides useful features like etag caching
 *
 * @example
 * // importing a client
 * const HTTPClient = require('@algodex/algodex-sdk/lib/http/HTTPClient')
 * const client = new HTTPClient('https://www.google.com', false)
 * client.get('/somepath').then(console.log)
 *
 * @example
 * // Creating a custom client
 * const HTTPClient = require('../HTTPClient');
 * // Declare any defaults
 * const BASE_URL = 'https://httpbin.org/get';
 *
 * // Static Function
 * function mapResponse({status, ...rest}){
 *   return Object.create({status: `mapped-${status}`, ...rest})
 * }
 *
 * // Custom Client Constructor
 * function CustomClient(baseUrl=BASE_URL, etags=false) {
 *   // Apply client
 *   const client = new HTTPClient(baseUrl, etags);
 *   Object.keys(client).forEach((key)=>{
 *     this[key] = client[key];
 *   });
 * }
 *
 * // Statics
 * CustomClient.mapResponse = mapResponse;
 *
 * // Extend from HTTPClient
 * CustomClient.prototype = Object.create(HTTPClient.prototype);
 * // Override/Assign prototypes
 * Object.assign(ExplorerClient.prototype, {
 *   async fetchHTTPBinGet() {
 *     return await this.get(`${this.baseUrl}`);
 *   },
 * });
 *
 * module.exports = CustomClient;
 *
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} etags Flag to enable Etag on GET Requests
 * @see https://axios-http.com/docs/intro
 * @ignore
 */
function HTTPClient(baseUrl, etags = false) {
  // TODO: Check for valid URL
  if (typeof baseUrl === 'undefined') throw new TypeError('Must have a valid URL');
  if (typeof etags !== 'boolean') throw new TypeError('etags must be a boolean!');

  /**
   * Base URL
   * @type {string}
   */
  this.baseUrl = baseUrl;
  /**
   * Etag State
   * @type {boolean}
   */
  this.etags = etags;
  if (etags) {
    /**
     * Cache for ETags
     * @type {{res: {}, etag: {}}}
     */
    this.cache = {
      etag: {},
      res: {},
    };
  }
}

// Extend from axios
HTTPClient.prototype = Object.create(axios);
// Override Axios with instance properties
Object.assign(HTTPClient.prototype, {
  /**
     *
     * Optionally check for etag changes in the API and update the local cache
     * when it is stale. Used to reduce request load from react-query
     * to the backend.
     *
     * @param {string} url Request URL
     * @param {object} options HTTPClient/Axios Options
     * @return {Promise<AxiosResponse>} Response or Cached Result
     * @memberOf http.HTTPClient.prototype
     */
  async get(url, options={}) {
    if (typeof url !== 'string') throw new TypeError('Must be a valid URL');
    if (typeof options !== 'object') throw new TypeError('Options must be an Object!');

    if (this.etags && typeof this.cache.etag[url] !== 'undefined') {
      if (typeof options.headers === 'undefined') {
        options.headers = {};
      }
      options.headers['if-none-match'] = this.cache.etag[url];
    }
    return !this.etags ?
      await axios.get(url, options) :
      await axios.get(url, options)
          .then((res) => {
            if (res && res.status === 200) {
              const etag = res.headers.etag;
              this.cache.res[url] = res;
              this.cache.etag[url] = etag;
              return res;
            } else {
              throw new Error('Unexpected Status');
            }
          })
          .catch((error) => {
            const errorResp = error.response;
            if (errorResp && errorResp.status === 304) {
              return this.cache.res[url];
            } else {
              throw new Error(`Invalid response: ${error.message}`);
            }
          });
  },
});

module.exports = HTTPClient;
