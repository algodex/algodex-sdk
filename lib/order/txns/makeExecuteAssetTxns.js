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
const getOptedIn = require('../../wallet/getOptedIn');
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
 * @param {boolean} [optIn] Flag for opting in
 * @param {string} [closeRemainderTo] Close Account
 * @param {Uint8Array} [note] Optional note field
 * @return {Promise<Structures>}
 */
async function makeExecuteAssetTxns(
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
    throw new Error('Must be maker only mode!');
  }

  // TODO use optIn
  const _optedIn = await getOptedIn(order.client, order.address, order.asset.id);

  // Discussion. We need to check if taker is opted into this scenario since taker is buying an ASA and not Algo.
  const {cutTakerOrder: {orderBookEscrowEntry: _selectedEscrowOrder}} =order;

  // order.contract.from = order.address;
  // order.contract.to = order.contract.creator; // For takers we close to escrow creator not to escrow itself
  order.contract.params = {
    ...await teal.getTransactionParams(order.client, order.contract.params, true),
    flatFee: false,
    fee: 0,
  };

  /**
   * taker Asset Structures
   * @type {Structures}
   */

  //   if (!exists) { // ToDo: I don't think we need to check if taker's exist

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
    enc.encode(order.contract.entry), // Will there ever be an entry that includes the address?
    // new Uint8Array([order.version]),
  ];

  if (typeof _selectedEscrowOrder.txnNum === 'number') _appArgs.push(enc.encode(_selectedEscrowOrder.txNum));

  const _outerTxns = [{
    // Payment Transaction
    unsignedTxn: closeRemainderTo ?
                                    algosdk.makeApplicationCloseOutTxn(
                                        order.contract.lsig.address(),
                                        order.contract.params,
                                        order.appId,
                                        _appArgs,
                                        _appAccts,
                                        [0],
                                        [order.asset.id]) :
                                    algosdk.makeApplicationNoOpTxn(
                                        order.contract.lsig.address(),
                                        order.contract.params,
                                        order.appId,
                                        _appArgs,
                                        _appAccts,
                                        [0],
                                        [order.asset.id]),

    lsig: order.contract.lsig,
  }];

  //   Transaction rerpresenting taker address paying escrowCreator for asset
  _outerTxns.push({
    unsignedTxn: await makePaymentTxn({
      ...order,
      contract: {
        ...order.contract,
        from: order.address,
        to: order.contract.creator,
        amount: order.contract.amountSending,
      },
    }, closeRemainderTo, note ),
    senderAcct: order.address,
  });
  //   }


  // TODO cleanup, see above
  if (!_optedIn) {
    logger.debug({address: order.address, asset: order.asset.id}, 'Opting in!');
    // OptIn Transaction
    _outerTxns.push({
      unsignedTxn: await makeAssetOptInTxn({
        ...order,
        contract: {
          ...order.contract,
          from: order.address,
        }}),
      senderAcct: order.address,
    });
  }

  //   Payment represents escrow sending asset to taker
  _outerTxns.push({
    unsignedTxn: await makeAssetTransferTxn({
      ...order,
      // amount: order.escrowAssetTradeAmount, // ToDo: Make sure Michael knows about this
      contract: {
        ...order.contract,
        from: order.contract.lsig.address(),
        to: order.address,
        amount: order.contract.amountReceiving},
    }, closeRemainderTo),
    lsig: order.contract.lsig,
  });

  const refundFees = 0.002 * 1000000; // this was what refund fees were in v1

  _outerTxns.push(closeRemainderTo ? { // TODO: Make sure that you check the sell side to see if that conditional needs modification
    unsignedTxn:
      algosdk.makePaymentTxnWithSuggestedParams(
          order.contract.lsig.address(),
          order.contract.creator,
          0,
          order.contract.creator,
          undefined,
          order.contract.params,
      ),


    lsig: order.contract.lsig,

  } : {
    unsignedTxn: await makePaymentTxn({
      ...order,
      contract: {
        to: order.contract.lsig.address(),
        from: order.address,
        amount: refundFees,
      },
    }),
    senderAcct: order.address,
  },
  );


  return _outerTxns;
}

module.exports = makeExecuteAssetTxns;
