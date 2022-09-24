/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const {
  makeApplicationClearStateTxn,
  makePaymentTxnWithSuggestedParams,
  LogicSigAccount,
} = require('algosdk');
const logger = require('../../../logger');
const teal = require('../../../teal');
const enc = require('../../../utils/encoder');
const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');


/**
 * # 🏭 makeCloseAlgoTxns(order)
 *
 * > Transaction Factory for Closing Buy Orders
 *
 * Closes a Buy Order. This will refund the amount sent to the Escrow account to the Creators account. Only the owner
 * of the escrow can issue the closeout. The contract escrow closeout requires three transactions.
 *
 * ### ❌ Cancel Order Transactions:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationClearStateTxn} | Application call to order book contract for closeout | {@link algosdk.LogicSigAccount} |
 * | TXN 1 | ESCROW TO BUYER | {@link algosdk.makePaymentTxnWithSuggestedParams} | Payment txn close out call | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | BUYER TO BUYER | {@link algosdk.makePaymentTxnWithSuggestedParams} | Send transaction for proof that closeout sender owns the escrow | {@link Wallet} |
 *
 * @example
 * const myOrders =await api.fetchOrders('wallet', '<WALLET ADDRESS>')
 * const cancelableOrder = await compile(myOrders[0])
 * const signedOrderTxns = sdkSigner([cancelableOrder])
 *
 * for (const group of signedOrderTxns) {
 *   const rawTxns = group.map((txn) => txn.blob);
 *   const {txId} = await client.sendRawTransaction(rawTxns).do();
 *   await algosdk.waitForConfirmation(client, txId, 10);
 * }
 *
 * @param {Order} order The Order Object
 * @return {Promise<Transactions>}
 * @memberOf module:txns/buy
 */
async function makeCloseAlgoTxns(order) {
  logger.debug('✨ Creating - CloseAlgoTxns');
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order?.contract?.creator !== 'string') {
    throw new TypeError('Must have a valid contract creator!!!');
  }

  if (order.type !== 'buy') {
    throw new TypeError('Only Support Buy Orders!!');
  }

  /**
   * Order Object
   * @type {Order}
   * @private
   */
  const _order = Object.create(order);

  // Ensure Compile step has run!
  if (!(_order.contract.lsig instanceof LogicSigAccount)) {
    // _order = await compile(_order);
    throw new Error('Invalid Lsig');
  }

  /**
   * Application Arguments
   * @type {Uint8Array[]}
   * @private
   */
  const _appArgs = [
    enc.encode('close'),
    enc.encode(order.contract.entry),
  ];

  // Fetch Suggested Params from Cache
  const _suggestedParams = await teal.getTransactionParams(
      _order.client,
      _order?.contract?.params,
      true,
  );

  return [
    {
      // Clear State Transaction
      unsignedTxn: makeApplicationClearStateTxn(
          _order.contract.lsig.address(),
          _suggestedParams,
          _order.appId,
          _appArgs,
      ),
      lsig: _order.contract.lsig,
    },
    {
      // Close Out Escrow Payment Transaction
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.contract.lsig.address(),
          _order.contract.creator,
          0,
          _order.contract.creator,
          undefined,
          _suggestedParams,
      ),
      lsig: _order.contract.lsig,
    },
    {
      // Payment Transaction to Prove Owner Wallet
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.contract.creator,
          _order.contract.creator,
          0,
          undefined,
          undefined,
          _suggestedParams,

      ),
      senderAcct: _order.address,
    },
  ];
}

module.exports = makeCloseAlgoTxns;
