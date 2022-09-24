/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const teal = require('../../../teal');

/**
 * # 🏭 makeExecuteAlgoTxns(order)
 *
 * > Transaction Factory for Executing Buy Orders
 *  ### ☠ Partial Order Execution:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationNoOpTxn} | Transaction must be a call to a stateful contract | {@link Wallet} |
 * | TXN 1 | ESCROW TO SELLER  | {@link algosdk.makePaymentTxn} | Payment transaction from this escrow to seller | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | SELLER TO BUYER | {@link algosdk.makeAssetTransferTxn} | Asset transfer from seller to owner of this escrow (buyer) | {@link Wallet} |
 * | TXN 3 | SELLER TO ESCROW | {@link algosdk.makePaymentTxn} | Pay fee refund transaction | {@link Wallet} |
 *
 *
 * ### ☠️ Full Order Execution:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationCloseOutTxn} | Transaction must be a call to a stateful contract | {@link Wallet} |
 * | TXN 1 | ESCROW TO SELLER | {@link algosdk.makeAssetTransferTxn} |  Payment transaction from this escrow to seller, with closeout to owner (buyer) | {@link Wallet} |
 * | TXN 2 | SELLER TO BUYER | {@link algosdk.makeAssetTransferTxn} |  Asset transfer from seller to owner of this escrow (buyer) | {@link Wallet} |
 *
 *
 * #

 * @param {Order} order The Order
 * @param {boolean} [withCloseout] Close Account
 * @return {Promise<Transactions>}
 * @memberOf module:txns/buy
 */
async function makeExecuteAlgoTxns(
    order,
    withCloseout = false,
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

  //   scrappy way to add batch uniqueness without encoding extra appArg
  const uniqueNote = enc.encode(`${Math.random()}`);

  let closeRemainderTo;
  if (withCloseout) {
    closeRemainderTo = order.contract.creator;
  }

  const _suggestedParams = await teal.getTransactionParams(order.client, order?.contract?.params, true);
  _suggestedParams.flatFee = false;
  _suggestedParams.fee = 0;


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
                'execute' :
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
                    _appAccts,
                    undefined,
                    undefined,
                    uniqueNote) :
                algosdk.makeApplicationCloseOutTxn(
                    order.contract.lsig.address(),
                    _suggestedParams,
                    order.appId,
                    _appArgs,
                    _appAccts,
                    undefined,
                    undefined,
                    uniqueNote),

      lsig: order.contract.lsig,
    },
    {
      // TXN 1 - ESCROW TO SELLER: Payment transaction from this escrow to seller
      // TXN 1 - ESCROW TO SELLER: Payment transaction from this escrow to seller, with closeout to owner (buyer)
      unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
          order.contract.lsig.address(),
          order.wallet.address,
          // TODO: fix total
          order.contract.total,
          closeRemainderTo, // closeRemainderTo will only be set during a withCloseout operation
          uniqueNote,
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
          uniqueNote,
          order.asset.id,
          _suggestedParams,
          undefined,
      ),
      senderAcct: order.wallet.address,

    },
  ];
  _outerTxns[2].unsignedTxn.flatFee = true;

  const refundFees = 0.002 * 1000000;
  if (typeof closeRemainderTo === 'undefined') {
    _outerTxns.push({
      // TXN 3 - SELLER TO ESCROW:    Pay fee refund transaction
      unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
          order.wallet.address,
          order.contract.lsig.address(),
          refundFees,
          undefined,
          uniqueNote,
          _suggestedParams,
          undefined,
      ),
      senderAcct: order.wallet.address,
    });
  }


  return _outerTxns;
}

module.exports = makeExecuteAlgoTxns;
