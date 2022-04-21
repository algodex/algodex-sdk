const algosdk = require('algosdk');
const getTransactionParams = require('../getTransactionParams');
/**
 * Asset Transfer Transaction
 *
 * @todo Convert to Constructor
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {string | algosdk.Account} from The account address or Account instance
 * @param {string | algosdk.Account} to The account address or Account instance\
 * @param {number} amount Payment amount
 * @param {number} assetIndex Algorand ASA Index
 * @param {algosdk.SuggestedParams} [suggestedParams] Suggested Params
 * @param {boolean} [shouldClose] Flag to close
 * @return {Promise<algosdk.Transaction>}
 */
async function makeAssetTransferTxn(
    client,
    from,
    to,
    amount,
    assetIndex,
    suggestedParams,
    shouldClose,
) {
  /**
   * From Account
   * @type {string|string}
   * @private
   */
  const _from = typeof from?.addr === 'undefined' && typeof from === 'string' ?
      from :
      from.addr;

  /**
   * To Account
   * @type {string|string}
   * @private
   */
  const _to =typeof to?.addr === 'undefined' && typeof to === 'string' ?
      to:
      to.addr;

  if (typeof _from !== 'string' || typeof _to !== 'string') {
    throw new TypeError('Accounts must be valid!');
  }

  if (typeof amount !== 'number') {
    throw new TypeError('Amount must be a valid Number!');
  }

  if (typeof assetIndex !== 'number') {
    throw new TypeError('assetIndex must be a valid Number!');
  }

  /**
   * Suggested Params
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = await getTransactionParams(client, suggestedParams, true);

  /**
   * Should Close Remainder To
   * @type {undefined|string}
   * @private
   */
  let _closeRemainderTo = undefined;
  if (shouldClose === true) {
    _closeRemainderTo = _to;
  }

  return algosdk.makeAssetTransferTxnWithSuggestedParams(
      _from,
      _to,
      _closeRemainderTo,
      undefined,
      amount,
      undefined,
      assetIndex,
      _suggestedParams,
  );
}

module.exports = makeAssetTransferTxn;
