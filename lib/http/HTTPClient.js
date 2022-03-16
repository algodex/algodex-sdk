const axios = require('axios');
/**
 * @typedef import('axios').AxiosResponse
 */
/**
 * Basic HTTP API Client
 *
 * includes etag support
 *
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} etags Flag to enable Etag on GET Requests
 * @constructor
 */
function HTTPClient(baseUrl, etags = false) {
  // TODO: Check for valid URL
  if (typeof baseUrl === 'undefined') throw new TypeError('Must have a valid URL');
  if (typeof etags !== 'boolean') throw new TypeError('etags must be a boolean!');

  this.baseUrl = baseUrl;
  this.etags = etags;
  if (etags) {
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
     * Axios Get
     *
     * Optionally check for etag changes in the API and update the local cache
     * when it is stale. Used to reduce request load from react-query
     * to the backend.
     *
     * @param {string} url Request URL
     * @param {object} options HTTPClient/Axios Options
     * @return {Promise<AxiosResponse<Object>>} Response or Cached Result
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
