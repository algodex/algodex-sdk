const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const makePaymentTxn = require('../makePaymentTxn');
const makeAssetTransferTxn = require('../makeAssetTransferTxn');
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
 *
 * @param {Order} order The Order
 * @param {boolean} [exists] Flag for existing order
 * @param {boolean} [optIn] Flag for opting in
 * @param {string} [closeRemainderTo] Close Account
 * @param {Uint8Array} [note] Optional note field
 * @return {Promise<Structures>}
 */
async function makeExecuteAlgoTxns(
    order,
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

  if (order.execution === 'maker') {
    throw new Error('Must be taker or both mode!');
  }


  // Discussion: No need to check if maker is opted in since they are bidding on asset,
  // taker is always opted into algo. No need to check if it exists for anything taker mode


  // order.contract.from = order.address;
  // order.contract.to = order.contract.creator; // For takers we close to escrow creator not to escrow itself
  order.contract.params = await teal.getTransactionParams(order.client, order.contract.params, true);

  /**
   * Taker Algo Structures
   * @type {Structures}
   */

  //   if (!exists) { // ToDo: I don't think we need to check if taker's exist
  logger.debug({entry: order.contract.entry.slice(59)}, 'Creating new order!');
  /**
     * Application Arguments
     * @type {Array}
     */
  const _appAccts = [
    order.contract.creator,
    order.address,
  ];

  /**
     * Application Arguments
     * @type {Array<Uint8Array>}
     */
  const _appArgs = [
    enc.encode(
          closeRemainderTo ?
          'execute_with_closeout':
          'execute',
    ),
    enc.encode(order.contract.entry), // Discussion: pointed out earlier but only need to slice if address is in entry
    new Uint8Array([order.version]),
  ];

  const _outerTxns = [{
    // Payment Transaction
    unsignedTxn: closeRemainderTo ?
                                    algosdk.makeApplicationCloseOutTxn(
                                        order.contract.lsig.address(),
                                        order.contract.params,
                                        order.appId,
                                        _appArgs,
                                        _appAccts) :
                                    algosdk.makeApplicationNoOpTxn(
                                        order.contract.lsig.address(),
                                        order.contract.params,
                                        order.appId,
                                        _appArgs,
                                        _appAccts),

    lsig: order.contract.lsig,
  }];

  //   Transaction rerpresenting taker address paying escrowCreator for asset
  _outerTxns.push({ // basing this off of withExecutAlgoOrderTxns
    unsignedTxn: await makePaymentTxn({
      ...order,
      contract: {
        ...order.contract,
        from: order.contract.lsig.address(),
        to: order.address,
        amount: order.contract.amountReceiving, // ::** TODO Figureout standard name
      },
    }, closeRemainderTo, note ),
    lsig: order.contract.lsig, // When queuedOrder matches taker price lsig is recompiled to escrowlsig
  });


  _outerTxns.push({
    unsignedTxn: await makeAssetTransferTxn({
      ...order,
      contract: {
        ...order.contract,
        amount: order.contract.amountSending, // :: TODO Figureout standard name
        from: order.address,
        to: order.contract.creator,
      },
    }, closeRemainderTo),
    sender: order.address,

  });

  const refundFees = 0.002 * 1000000;
  if (typeof closeRemainderTo === 'undefined') {
    // create refund transaction for fees
    _outerTxns.push({
      unsignedTxn: await makePaymentTxn({
        ...order,
        contract: {
          ...order.contract,
          from: order.address,
          to: order.contract.lsig.address(),
          amount: refundFees,
        },

      }),
      sender: order.address,

    },
    );
  }


  return _outerTxns;
}

module.exports = makeExecuteAlgoTxns;
