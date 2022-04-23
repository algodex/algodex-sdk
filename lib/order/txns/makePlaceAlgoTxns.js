const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const enc = require('../../utils/encoder');
const {
  makePaymentTxn,
  makeAssetTransferTxn,
  makeTransactionFromLogicSig,
} = require('../txns');
/**
 * @typedef {Object} Structure
 * @property {algosdk.Transaction} unsignedTxn A unsigned Transaction
 * @property {algosdk.Account | Wallet} senderAcct Wallet or Algosdk Account
 */

/**
 * @typedef {Structure[]} Structures
 */
/**
 *
 * @param {Order} order The Order
 * @param {boolean} [exists] Flag for existing order
 * @param {boolean} [optIn] Flag for opting in
 * @param {string} [closeRemainderTo] Close Account
 * @param {Uint8Array} [note] Optional note field
 * @return {Promise<Structures>}
 */
async function makePlaceAlgoTxns(
    order,
    exists = false,
    optIn = false,
    closeRemainderTo,
    note,
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

  /**
   * Place Algo Structures
   * @type {Structures}
   */
  const _outerTxns = [{
    // Payment Transaction
    unsignedTxn: await makePaymentTxn(order, closeRemainderTo, note),
    senderAcct: order.wallet,
  }];

  if (!exists) {
    /**
     * Application Arguments
     * @type {Array<Uint8Array>}
     */
    const _appArgs = [
      enc.encode('open'),
      enc.encode(order.contract.entry.slice(59)),
      new Uint8Array([order.appId]),
    ];

    // Existing Escrow Transaction
    _outerTxns.push({
      unsignedTxn: await makeTransactionFromLogicSig(
          order,
          'appOptIn',
          _appArgs,
      ),
      lsig: order.contract.lsig,
    });
  }

  if (optIn) {
    // OptIn Transaction
    _outerTxns.push({
      unsignedTxn: await makeAssetTransferTxn(
          order,
          false,
      ),
      senderAcct: order.wallet,
    });
  }

  return _outerTxns;
}

module.exports = makePlaceAlgoTxns;
