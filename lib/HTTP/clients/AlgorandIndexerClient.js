/*
 * Algorand Indexer REST API Interface
 *
 * @copyright Algonaut Inc
 */
const HTTPClient = require('../HTTPClient');

/**
 * Algorand Indexer HTTP Client
 *
 * @TODO: Remove this in favor of algosdk.Indexer()
 * @param {string} baseUrl Base URL to use for API requests
 * @extends HTTPClient
 * @memberOf http
 * @constructor
 */
function AlgorandIndexerClient(baseUrl) {
  // Apply client
  const client = new HTTPClient(baseUrl);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
AlgorandIndexerClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(AlgorandIndexerClient.prototype, {
  /**
   * Search Explorer Assets
   *
   * @param {string | number} search Search Query
   * @return {Promise<*>}
   * @memberOf http.AlgodexIndexerClient.prototype
   */
  async fetchTransactionParams() {
    const {data} = await this.get(`${this.baseUrl}/v2/transactions/params`);
    return data;
  },
});

module.exports = AlgorandIndexerClient;
