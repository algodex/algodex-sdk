/*
 * Algodex REST API Interface
 *
 * Includes all responses from the publicly exposed routes
 *
 * @author Alexander Trefonas
 * @author Michael Feher
 * @copyright Algonaut Inc
 */

const HTTPClient = require('../HTTPClient.js');
// TODO: Implement getLogger() from '@algodex/common'

/**
 * # 🕸 Algodex HTTP Client
 *
 * Used to connect to the Algodex REST endpoints
 *
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} [etags] Flag to enable Etag on GET Requests
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function AlgodexClient(baseUrl, etags=true) {
  // Apply client
  const client = new HTTPClient(baseUrl, etags);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
AlgodexClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(AlgodexClient.prototype, {
  /**
   * Fetch Asset's Chart
   *
   * Returns OHLCV(Open, High, Low, Close, Volume) response from the API.
   * Used in lightweight-charts to display the Candlestick and Area views.
   *
   * @param {number|string} id Unique Asset Identifier
   * @param {string} interval Time interval to aggregate data on
   * @return {Promise<Object>}
   */
  async fetchAssetChart(id, interval) {
    console.debug(`fetchAssetChart(${id}, ${interval})`);
    const res = await this.get(
        `${this.baseUrl}/charts2.php?assetId=${id}&chartTime=${interval}`,
    );
    return res.data;
  },

  /**
   * Fetch Asset's Orders
   * @param {number|string} id Unique Asset Identifier
   * @return {Promise<Object>}
   */
  async fetchAssetOrders(id) {
    console.debug(`fetchAssetOrders(${id})`);
    const url = `${this.baseUrl}/orders.php?assetId=${id}`;
    const res = await this.get(url);

    return res.data;
  },

  /**
   *
   * Fetch Wallet's Orders
   *
   * @TODO: Deprecate includeAssetInfo
   * @param {string} address Account Address
   * @param {boolean} includeAssetInfo Should fetch asset info
   * @return {Promise<Object>}
   */
  async fetchWalletOrders(address, includeAssetInfo = true) {
    console.debug(
        `fetchOpenOrdersByAddress(${address}, ${includeAssetInfo})`,
    );
    const res = await this.get(
        `${this.baseUrl}/orders.php?ownerAddr=${address}&getAssetInfo=${includeAssetInfo}`,
    );
    return res.data;
  },

  /**
   * Fetch Asset's Trade History
   *
   * @param {string | number} id
   * @return {Promise<Object>}
   */
  async fetchAssetTradeHistory(id) {
    console.debug(`fetchAssetTradeHistory(${id})`);
    const res = await this.get(`${this.baseUrl}/trade_history.php?assetId=${id}`);
    return res.data;
  },

  /**
   * Fetch Wallet's Trade History
   * @param {string} address
   * @param {boolean} includeAssetInfo
   * @return {Promise<Object>}
   */
  async fetchWalletTradeHistory(address, includeAssetInfo = true) {
    console.debug(`fetchWalletTradeHistory(${address}, ${includeAssetInfo})`);
    const res = await this.get(
        `${this.baseUrl}/trade_history.php?ownerAddr=${address}&getAssetInfo=${includeAssetInfo}`,
    );
    return res.data;
  },

  /**
   * Fetch Wallet's Assets
   * @param {string} address
   * @return {Promise<Object>}
   */
  async fetchWalletAssets(address) {
    console.debug(`fetchWalletAssets(${address})`);
    const res = await this.get(`${this.baseUrl}/wallet_assets.php?ownerAddr=${address}`);
    return res.data;
  },

  /**
   * Search for Assets
   * @param {string} query
   * @return {Promise<{assets: any}>}
   */
  async searchAssets(query) {
    console.debug(`searchAssets(${query})`);
    const res = await this.get(`${this.baseUrl}/asset_search.php?query=${query}`);
    return {assets: res.data};
  },

  /**
   * Fetch Assets
   *
   * Return all available Assets in Algodex.
   *
   * @return {Promise<*>}
   */
  async fetchAssets() {
    console.debug('fetchAssets()');
    const {
      data: {data},
    } = await this.get(`${this.baseUrl}/assets.php`);
    return data;
  },

  /**
   * Fetch Asset's Price
   *
   * Get Asset state from Algodex
   *
   * @param {string|number} id
   * @return {Promise<*>}
   */
  async fetchAssetPrice(id) {
    console.debug(`fetchAssetPrice(${id})`);
    const res = await this.get(`${this.baseUrl}/assets.php?id=${id}`);
    const {
      data: {data},
    } = res;
    return data[0];
  },
});

module.exports = AlgodexClient;
