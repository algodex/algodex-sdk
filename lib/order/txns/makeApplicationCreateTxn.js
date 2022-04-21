// eslint-disable-next-line no-unused-vars
const algosdk = require('algosdk');
const teal = require('../../teal');
const algoOrderBookSource = require('../teal/ALGO_Orderbook.teal');
const asaOrderBookSource = require('../teal/ASA_Orderbook.teal');
const getTransactionParams = require('../../teal/getTransactionParams');

/**
 * # 🏗 Create Orderbook Application
 *
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {'buy'|'sell'} type Type of orderbook to create
 * @param {algosdk.Account} from address of sender
 * @param {algosdk.SuggestedParams} [suggestedParams] a dict holding common-to-all-txns
 * @param {algosdk.OnApplicationComplete} [onComplete] what application should do once the program is done being run
 * @param {string} [approvalProgramSource] application source as a string
 * @param {string} [clearProgramSource] clear program source as a string

 * @return {Promise<Transaction>}
 * @memberOf module:order/txns
 */
async function makeApplicationCreateTxn(
    client,
    type,
    from,
    suggestedParams,
    onComplete,
    approvalProgramSource,
    clearProgramSource,
) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Must have a valid Algodv2!');
  }

  const orderTypes = ['buy', 'sell'];
  if (typeof type !== 'string' || !orderTypes.includes(type)) {
    throw new TypeError(`Must be a valid order type! Supported types are: ${orderTypes}`);
  }
  /**
   * From Account
   * @type {string|string}
   * @private
   */
  const _from = typeof from?.addr === 'undefined' && typeof from === 'string' ?
      from :
      from.addr;

  if (typeof _from !== 'string') {
    throw new TypeError('Invalid from account!');
  }
  /**
   * Approval Program Source
   * @type {string}
   * @private
   */
  const _approvalProgramSource = typeof approvalProgramSource === 'string' ?
    approvalProgramSource :
    type === 'buy' ? algoOrderBookSource : asaOrderBookSource;


  if (typeof _approvalProgramSource !== 'string') {
    throw new TypeError('Approval program source must be a string!');
  }

  // declare application state storage (immutable)
  const _localInts = 2;
  const _localBytes = 1;
  const _globalInts = 0;
  const _globalBytes = 1;

  // get node suggested parameters
  const _suggestedParams = await getTransactionParams(client, suggestedParams, true);

  return teal.txns.makeApplicationCreateTxn(
      client, // Pass through
      _from,
      _suggestedParams,
      onComplete, // Teal library defaults to NoOp
      _approvalProgramSource,
      clearProgramSource, // Teal library defaults
      _localInts,
      _localBytes,
      _globalInts,
      _globalBytes,
  );
}

module.exports = makeApplicationCreateTxn;
