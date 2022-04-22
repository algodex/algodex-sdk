const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
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
 * @param {Uint8Array} [note] Optional note field
 * @return {Promise<Structures>}
 */
async function makePlaceAlgoTxns(
    order,
    exists = false,
    optIn = false,
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

  const txn = await makePaymentTxn(order, note, false);

  /**
   * Place Algo Structures
   * @type {Structures}
   */
  const outerTxns = [];

  outerTxns.push({
    unsignedTxn: txn,
    senderAcct: order.wallet,
  });

  /**
   *
   * @type {Array<Uint8Array>}
   */
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  appArgs.push(enc.encode(order.contract.entry.slice(59)));
  appArgs.push(new Uint8Array([order.appId]));

  if (!exists) {
    const logSigTrans = await makeTransactionFromLogicSig(
        order,
        'appOptIn',
        appArgs,
    );
    outerTxns.push({
      unsignedTxn: logSigTrans,
      lsig: order.contract.lsig,
    });
  }

  if (optIn) {
    // asset opt-in transfer
    const assetOptInTxn = await makeAssetTransferTxn(
        order,
        false,
    );

    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: order.wallet,
    });
  }
  return outerTxns;
}

module.exports = makePlaceAlgoTxns;
