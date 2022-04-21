/*
 * Explorer REST API Interface
 *
 * Includes useful responses from the publicly exposed routes
 *
 * @author Alexander Trefonas
 * @author Michael Feher
 * @copyright Algonaut Inc
 */

const HTTPClient = require('../HTTPClient');

/**
 * # 🕸 Tinyman HTTP Client
 * @TODO: Generate from OAS/Swagger
 * @TODO: hoist etags to top level config
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} [etags] Optional etags to cache
 * @param {Config} config Requited configuration for indexer. Must support token
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function TinymanClient(baseUrl, etags, config) {
  // Apply client
  const client = new HTTPClient(baseUrl, etags, config);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
TinymanClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(TinymanClient.prototype, {
  /**
   * Fetch Account Info
   * @return {Promise<Object>}
   */
  async fetchCurrentAssetPrices() {
    const res = await this.get(`${this.baseUrl}/api/v1/current-asset-prices/`);
    return res.data;
  },
});

module.exports = TinymanClient;
