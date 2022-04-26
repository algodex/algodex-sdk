const algosdk = require('algosdk');
const logger = require('../logger');
let _cache;
let _expireDate;

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
    cache = true,
) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Must have valid Algod Client!');
  }

  // Set expires date
  if (typeof _expireDate === 'undefined') {
    _expireDate = new Date();
    _expireDate.setHours(_expireDate.getHours() + 1);
  }

  // Expired flag
  const isExpired = Date.now() > _expireDate;

  // Return from cache
  if (cache && typeof _cache !== 'undefined' && !isExpired) {
    return _cache;
  }

  logger.warn({cache, suggestedParams}, 'Fetching Transaction Params');

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
    _cache = _suggestedParams;
  }
  return _suggestedParams;
}

module.exports = getTransactionParams;
