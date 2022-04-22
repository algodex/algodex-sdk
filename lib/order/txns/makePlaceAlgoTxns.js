const algosdk = require('algosdk');
const AlgodError = require('../../Errors/AlgodError');
const makePaymentTxn = require('../txns/makePaymentTxn');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const makeTransactionFromLogicSig = require('../../teal/txns/makeTransactionFromLogicSig');
/**
 * @typedef {Object} Structure
 * @property {algosdk.Transaction} unsignedTxn A unsigned Transaction
 * @property {algosdk.Account| Wallet} senderAcct Wallet or Algosdk Account
 */

/**
 * @typedef {Array<Structure>} Structures
 */
/**
 *
 * @param {Order} order The Order
 * @param {boolean} [exists] Flag for existing order
 * @param {boolean} [optIn] Flag for opting in
 * @return {Promise<Structures>}
 */
async function makePlaceAlgoTxns(
    order,
    exists = false,
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

  const txn = await makePaymentTxn(order, false);

  /**
   * Place Algo Structures
   * @type Structures}
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

  let logSigTrans = null;

  if (!exists) {
    logSigTrans = await makeTransactionFromLogicSig(
        order.client, 'appOptIn', order.contract.lsig, undefined, order.appId, appArgs,
    );
    outerTxns.push({
      unsignedTxn: logSigTrans,
      lsig: order.contract.lsig,
    });
  }

  if (optIn) {
    // asset opt-in transfer
    const assetOptInTxn = await makeAssetTransferTxn(client, makerAddr, makerAddr, 0, assetId, false);

    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: makerAccount,
    });
  }
  return outerTxns;
}

module.exports = makePlaceAlgoTxns;
