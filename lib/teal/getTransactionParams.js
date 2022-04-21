// eslint-disable-next-line no-unused-vars
const algosdk = require('algosdk');

let _suggestedParamsCache;

/**
 * Get Transaction Parameters
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {algosdk.SuggestedParams} [suggestedParams] Suggested Parameters
 * @param {boolean} [cache] Enable Param Cache
 * @return {Promise<algosdk.SuggestedParams>}
 */
async function getTransactionParams(
    client,
    suggestedParams,
    cache = false,
) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Must have valid Algod Client!');
  }
  // Return from cache
  if (cache && typeof _suggestedParamsCache !== 'undefined') {
    return _suggestedParamsCache;
  }
  /**
   * Suggested Params
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = typeof suggestedParams === 'undefined' ?
    await client.getTransactionParams().do() :
    Object.create(suggestedParams);

  // comment out the next two lines to use suggested fee
  _suggestedParams.fee = 1000;
  _suggestedParams.flatFee = true;

  // Store in cache
  if (cache) {
    _suggestedParamsCache = _suggestedParams;
  }
  return _suggestedParams;
}

module.exports = getTransactionParams;
