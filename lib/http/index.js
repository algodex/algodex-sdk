/**
 * # HTTP Namespace for all axios calls
 *
 * @example
 * import http from '@algodex/algodex-sdk/lib/http'
 * const dexClient = new http.AlgodexClient('https://testnet.algodex.com/algodex-backend')
 * let asset = await dexClient.fetchAsset({id: 123456})
 *
 * @namespace http
 */
module.exports = {
  ExplorerClient: require('./clients/ExplorerClient'),
  IndexerClient: require('./clients/IndexerClient'),
  HTTPClient: require('./HTTPClient'),
};


