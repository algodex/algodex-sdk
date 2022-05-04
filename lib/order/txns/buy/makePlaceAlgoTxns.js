const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const teal = require('../../../teal');

/**
 * @typedef {Object} Structure
 * @property {algosdk.Transaction} unsignedTxn A unsigned Transaction
 * @property {algosdk.Account | Wallet} senderAcct Wallet or Algosdk Account
 */

/**
 * @typedef {Structure[]} Structures
 */
/**
 * Place Algo Transactions
 *
 * Place a buy order into the Algorand Orderbook. This is referred to as a "Maker" order which is
 * "Placed into the Orderbook". If the order has been previously placed it will have a contract
 * key called "creator". This key determines if the order should call the ALGO delegate contract
 * application opt in. The appOptIn transaction is critical for having orders appear in the
 * Algodex Indexer API.
 *
 * Once the initial transaction has been created and the contract.creator has been sent, the sdk
 * reverts to regular payment transactions to the escrow account. These payment transactions
 * should include a note that relates to the operation for indexing since they will not have
 * the orderbook application call.
 *
 * The transaction generator also supports bypassing the opt-in check by passing in the optIn flag
 *
 *
 *
 * @param {Order} order The Order
 * @param {boolean} [optIn] Flag for opting in
 * @return {Promise<Structures>}
 */
async function makePlaceAlgoTxns(
    order,
    optIn = false,
) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }

  if (order.execution !== 'maker') {
    throw new Error('Must be maker only mode!');
  }

  // TODO: Note that contains the creator address and the current operation.
  const _note = undefined;

  // If the order has a creator key, it already exists
  const _exists = typeof order?.contract?.creator !== 'undefined';
  let _optIn = optIn;

  // TODO: Remove, just use order.wallet['assets] and only fetch if it doesn't exist
  if (typeof order?.wallet?.assets === 'undefined') {
    logger.warn({address: order.address}, 'Loading account info!');
    const makerAccountInfo = await order.client.accountInformation(order.address).do();
    if (makerAccountInfo != null && makerAccountInfo['assets'] != null &&
      makerAccountInfo['assets'].length > 0) {
      for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
        if (makerAccountInfo['assets'][i]['asset-id'] === order.asset.id) {
          _optIn = true;
          break;
        }
      }
    }
  }

  const _suggestedParams = await teal.getTransactionParams(order.client, order.contract.params, true);

  /**
   * Place Algo Structure
   * @type {Structures}
   */
  const _outerTxns = [{
    // Payment Transaction
    // TODO: Add Note that tracks this payment transaction when the escrow already exists
    unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
        order.address,
        order.contract.lsig.address(),
        order.contract.total,
        undefined,
        _note,
        _suggestedParams,
        undefined,
    ),
    senderAcct: order.address,
  }];

  // Open Order Transaction
  if (!_exists) {
    logger.debug({entry: order.contract.entry.slice(59)}, 'Creating new order!');
    /**
     * Application Arguments
     * @type {Array<Uint8Array>}
     */
    const _appArgs = [
      enc.encode('open'),
      enc.encode(order.contract.entry.slice(59)),
      new Uint8Array([order.version]),
    ];

    // Create Escrow appOptIn Transaction
    // This contract application args are parsed by the Algodex Indexer
    _outerTxns.push({
      unsignedTxn: await teal.txns.makeTransactionFromLogicSig(
          order.client,
          'appOptIn',
          order.contract.lsig,
          order?.contract?.params,
          order.appId,
          _appArgs,
      ),
      lsig: order.contract.lsig,
    });
  }

  // Optin Transaction
  if (!_optIn) {
    logger.debug({address: order.address, asset: order.asset.id}, 'Opting in!');
    _outerTxns.push({
      unsignedTxn: algosdk.makeAssetTransferTxnWithSuggestedParams(
          order.address,
          order.address,
          undefined,
          undefined,
          0,
          undefined,
          order.asset.id,
          _suggestedParams,
          undefined,
      ),
      senderAcct: order.address,
    });
  }

  return _outerTxns;
}

module.exports = makePlaceAlgoTxns;
