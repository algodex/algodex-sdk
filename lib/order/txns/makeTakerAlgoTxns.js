const algosdk = require('algosdk');
const logger = require('../../logger');
const AlgodError = require('../../error/AlgodError');
const enc = require('../../utils/encoder');
const {
  makePaymentTxn,
  makeAssetOptInTxn,
  makeAssetTransferTxn,
} = require('../txns');
const teal = require('../../teal');
const OrderTypeError = require('../error/OrderTypeError');

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
async function makeTakerAlgoTxns(
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

  if (order.execution !== 'taker') {
    throw new Error('Must be maker only mode!');
  }

  // TODO use optIn
  let makerAlreadyOptedIntoASA = false;

  // TODO: Remove, just use order.wallet['assets] and only fetch if it doesn't exist
  if (typeof order?.wallet?.assets === 'undefined') {
    logger.warn({address: order.address}, 'Loading account info!');
    const makerAccountInfo = await order.client.accountInformation(order.address).do();
    if (makerAccountInfo != null && makerAccountInfo['assets'] != null &&
      makerAccountInfo['assets'].length > 0) {
      for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
        if (makerAccountInfo['assets'][i]['asset-id'] === order.asset.id) {
          makerAlreadyOptedIntoASA = true;
          break;
        }
      }
    }
  }


  order.contract.from = order.address;
  order.contract.to = order.contract.creator; // For takers we close to escrow creator not to escrow itself
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
    enc.encode(order.contract.entry.slice(59)),
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
  _outerTxns.push({
    unsignedTxn: await makePaymentTxn(order, closeRemainderTo, note ),
    senderAcct: order.address,
  });
  //   }


  // TODO cleanup, see above
  if (!makerAlreadyOptedIntoASA) {
    logger.debug({address: order.address, asset: order.asset.id}, 'Opting in!');
    // OptIn Transaction
    _outerTxns.push({
      unsignedTxn: await makeAssetOptInTxn(order),
      senderAcct: order.address,
    });
  }

  //   Payment represents escrow sending asset to taker
  _outerTxns.push({
    unsignedTxn: makeAssetTransferTxn({
      ...order,
      amount: order.escrowAssetTradeAmount, // ToDo: Make sure Michael knows about this
      contract: {
        from: order.contract.lsig.address(),
        to: order.address},
    }, closeRemainderTo),

  });

  const refundFees = 0.002 * 10000000; // this was what refund fees were in v1

  _outerTxns.push({
    unsignedTxn: closeRemainderTo ?
                                    algosdk.makePaymentTxnWithSuggestedParams(
                                        order.contract.lsig.address(),
                                        order.contract.creator,
                                        0,
                                        order.contract.creator,
                                        undefined,
                                        order.contract.params,
                                    ):
                                      await makePaymentTxn({
                                        ...order,
                                        amount: refundFees, // in case of a partial fill
                                        contract: {to: order.contract.lsig.address()},
                                      }),

  });


  return _outerTxns;
}

module.exports = makeTakerAlgoTxns;
