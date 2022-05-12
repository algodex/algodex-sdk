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
 * # 🏭 makeExecuteAlgoTxns(order)
 *
 * > Transaction Factory for Executing Buy Orders
 * ///////////////////////////////////
 * // EXECUTE
 * //   (PARTIAL ORDER EXECUTION)
 * /////////////////////////////////
 *     // TXN 0 - ESCROW TO ORDERBOOK: Transaction must be a call to a stateful contract
 *     // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller
 *     // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)
 *     // TXN 3 - SELLER TO ESCROW:    Pay fee refund transaction
 * // EXECUTE (ORDER EXECUTION)
 * //   WITH CLOSEOUT
 *     // TXN 0 - ESCROW TO ORDERBOOK: transaction must be a call to a stateful contract
 *     // TXN 1 - ESCROW TO SELLER:    Payment transaction from this escrow to seller, with closeout to owner (buyer)
 *     // TXN 2 - SELLER TO BUYER:     Asset transfer from seller to owner of this escrow (buyer)
 *
 * @param {Order} order The Order
 * @param {boolean} [withCloseout] Close Account
 * @return {Promise<Structures>}
 * @memberOf module:txns/buy
 */
async function makeExecuteAlgoTxns(
    order,
    withCloseout =false,
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
  // console.log(order.contract.lsig.address(), order.wallet.address, order.address, order.contract.creator);
  const seller = order.wallet.address;
  const buyer = order.contract.creator;
  const lsig = order.contract.lsig;

  let closeRemainderTo;
  if (withCloseout) {
    closeRemainderTo = order.contract.creator;
  }

  const _suggestedParams = await teal.getTransactionParams(order.client, order?.contract?.params, true);


  //   if (!exists) { // ToDo: I don't think we need to check if taker's exist
  logger.debug({entry: order.contract.entry}, 'Creating new order!');
  /**
     * Application Arguments
     * @type {Array}
     */
  const _appAccts = [
    order.contract.creator,
    order.wallet.address,
  ];

  /**
     * Application Arguments
     * @type {Array<Uint8Array>}
     */
  const _appArgs = [
    enc.encode(
      typeof closeRemainderTo === 'undefined' ?
          'execute':
          'execute_with_closeout',
    ),
    enc.encode(order.contract.entry), // Discussion: pointed out earlier but only need to slice if address is in entry
  ];

  /**
   * Taker Algo Structures
   * @type {Structures}
   */
  const _outerTxns = [
    {
    // TXN 0 - ESCROW TO ORDERBOOK: transaction must be a call to a stateful contract
      unsignedTxn: typeof closeRemainderTo === 'undefined' ?
        algosdk.makeApplicationNoOpTxn(
            order.contract.lsig.address(),
            _suggestedParams,
            order.appId,
            _appArgs,
            _appAccts) :
        algosdk.makeApplicationCloseOutTxn(
            order.contract.lsig.address(),
            _suggestedParams,
            order.appId,
            _appArgs,
            _appAccts),

      lsig: order.contract.lsig,
    },
    {
      // TXN 1 - ESCROW TO SELLER: Payment transaction from this escrow to seller
      // TXN 1 - ESCROW TO SELLER: Payment transaction from this escrow to seller, with closeout to owner (buyer)
      unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
          order.contract.lsig.address(),
          order.wallet.address,
          // TODO: fix total
          order.contract.total-10000,
          closeRemainderTo, // closeRemainderTo will only be set during a withCloseout operation
          undefined,
          _suggestedParams,
          undefined,
      ),
      lsig: order.contract.lsig, // When queuedOrder matches taker price lsig is recompiled to escrowlsig
    },
    {
      // TXN 2 - SELLER TO BUYER: Asset transfer from seller to owner of this escrow (buyer)
      unsignedTxn: algosdk.makeAssetTransferTxnWithSuggestedParams(
          order.wallet.address,
          order.contract.creator,
          undefined,
          undefined,
          order.contract.amount,
          undefined,
          order.asset.id,
          _suggestedParams,
          undefined,
      ),
      senderAcct: order.wallet.address,

    },
  ];

  const refundFees = 0.002 * 1000000;
  if (typeof closeRemainderTo === 'undefined') {
    _outerTxns.push({
      // TXN 3 - SELLER TO ESCROW:    Pay fee refund transaction
      unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
          order.wallet.address,
          order.contract.lsig.address(),
          refundFees,
          undefined,
          undefined,
          _suggestedParams,
          undefined,
      ),
      senderAcct: order.wallet.address,
    });
  }


  return _outerTxns;
}

module.exports = makeExecuteAlgoTxns;
