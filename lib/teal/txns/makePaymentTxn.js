const algosdk = require('algosdk');
const logger = require('../../logger');
const getSuggestedParams = require('../getTransactionParams');
/**
 * Make Payment Transaction
 *
 * Maps a Payment to makePaymentTxnWithSuggestedParams. Used as a part
 * of Transactions
 *
 * @todo make Constructor
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {algosdk.Account | string} from The account address or Account instance
 * @param {algosdk.Account | string} to The account address or Account instance
 * @param {number} amount Payment amount
 * @param {boolean} [shouldClose] Flag to close
 * @param {Uint8Array} [note] Encoded Notes
 * @param {algosdk.SuggestedParams} [suggestedParams] Suggested Parameters
 * @return {Promise<Transaction>}
 */
async function makePaymentTxn(
    client,
    from,
    to,
    amount,
    shouldClose,
    note,
    suggestedParams) {
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
  const _to = typeof to?.addr === 'undefined' && typeof to === 'string' ?
      to:
      to.addr;

  if (typeof _from !== 'string' || typeof _to !== 'string') {
    throw new TypeError('Accounts must be valid!');
  }

  if (typeof amount !== 'number') {
    throw new TypeError('Amount must be a valid Number!');
  }

  /**
   * Suggested Params
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = await getSuggestedParams(client, suggestedParams, true);

  /**
   * Should Close Remainder To
   * @type {undefined|string}
   * @private
   */
  let _closeRemainderTo = undefined;
  if (shouldClose === true) {
    _closeRemainderTo = _to;
  }

  logger.debug({_from, _to, amount, _closeRemainderTo, note, _suggestedParams});
  return algosdk.makePaymentTxnWithSuggestedParams(
      _from,
      _to,
      amount,
      _closeRemainderTo,
      note,
      _suggestedParams,
  );
}

module.exports = makePaymentTxn;
