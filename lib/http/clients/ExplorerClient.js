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
const ALGO_PRICE_API = 'https://price.algoexplorerapi.io/price/algo-usd';

/**
 * Convert Explorer Asset to Algodex Asset
 *
 * Explorer returns a non-standard ASA format which must be mutated
 *
 * @see https://testnet.algoexplorerapi.io/v1/asset/408947/info
 * @param {Object} explorerIndexAsset The asset response
 * @return {object} Asset
 */
function toExplorerAsset(asset) {
  const {
    assetID: id,
    assetName: fullName,
    unitName: name,
    txCount: txns,
    circulatingSupply: circulating,
    destroyed: deleted,
    totalSupply: total,
    txid,
    timestamp,
    decimals,
    verified,
    url,
    verified_info,

  } = asset;
  const res = {
    id,
    deleted,
    txid,
    timestamp,
    decimals,
    name,
    txns,
    fullName,
    circulating,
    verified,
    url: url || null,
    total,
  };
  if (verified && verified_info) {
    res.verifiedInfo = verified_info;
  }
  return res;
}

/**
 * # 🕸 AlgoExplorer HTTP Client
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function ExplorerClient(baseUrl) {
  // Apply client
  const client = new HTTPClient(baseUrl);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Statics
ExplorerClient.toExplorerAsset = toExplorerAsset;

// Extend from HTTPClient
ExplorerClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(ExplorerClient.prototype, {

  /**
   * ## [🔍 Search](#fetchExplorerSearch)
   *
   * ### ⚡ fetchExplorerSearch()
   *
   * @param {string | number} search Search Query
   * @return {Promise<*>}
   */
  async fetchExplorerSearch(search) {
    const {data} = await this.get(`${this.baseUrl}/v1/search/${search}`);
    return data;
  },
  /**
   * Fetch Asset Info
   *
   * Uses Algodex Explorer V1 Asset Info API
   *
   * @param {string|number} id Asset ID
   * @return {Promise<{object}>}
   */
  async fetchExplorerAssetInfo(id) {
    if (typeof id === 'undefined') {
      throw new TypeError('Must have ID');
    }
    const {data} = await this.get(`${this.baseUrl}/v1/asset/${id}/info`);
    return ExplorerClient.toExplorerAsset(data);
  },
  /**
   * Get Algorand price
   *
   * Retrieve price of Algorand from the Algorand Indexer
   *
   * @see https://price.algoexplorerapi.io/price/algo-usd
   */
  async fetchAlgorandPrice() {
    const {data} = await this.get(`${ALGO_PRICE_API}`);
    return {algoPrice: data.price};
  },
});

module.exports = ExplorerClient;
