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
const getOptedIn = require('../../../wallet/getOptedIn');

/**
 * # 🏭 makePlaceAlgoTxns(order)
 *
 * > Transaction Factory for Placing Buy Orders
 *
 *
 * Place a buy order into the Algodex {@tutorial Orderbook}. This is referred to as a {@tutorial Maker} order which is
 * "Placed into the Orderbook". If the order has been previously placed it will have a contract
 * key called "creator". This key determines if the order should call the ALGO delegate contract
 * application opt in.
 *
 * Once the initial transaction has been created and the contract.creator has been sent, the sdk
 * reverts to regular payment transactions to the escrow account. These payment transactions
 * should include a note that relates to the operation for indexing since they will not have
 * the orderbook application call.
 *
 * The transaction generator also supports bypassing the opt-in check by passing in the optIn flag
 *
 * ## ALGO Delegate Contract Transactions
 *
 * ### ➕ Open Order Transactions:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | BUYER TO ESCROW | {@link algosdk.makePaymentTxn} | Pay from order creator to escrow account | {@link Wallet} |
 * | TXN 1 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationOptInTxn} | Stateful app opt-in to order book | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | BUYER TO BUYER | {@link algosdk.makeAssetTransferTxn} | (Optional) ASA opt-in for the order creator's original wallet account | {@link Wallet} |
 *
 * ### 💰 Add Funds to Order Escrow Transactions:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | BUYER TO ESCROW | {@link algosdk.makePaymentTxn} | Pay from order creator to escrow account | {@link Wallet} |
 * | TXN 1 | BUYER TO BUYER | {@link algosdk.makeAssetTransferTxn} | (Optional) ASA opt-in for the order creator's original wallet account | {@link Wallet} |
 *
 * #
 *
 *
 * @example
 * const {makePlaceAlgoTxns, compile} = require('@algodex/algodex-sdk')
 * const txns = makePlaceAlgoTxns( await compile({
 *    'asset': {
 *         'id': 15322902,
 *         'decimals': 6,
 *       },
 *       'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
 *       'price': 2,
 *       'amount': 1,
 *       'total': 2,
 *       'execution': 'maker',
 *       'type': 'buy',
 *       'appId': 22045503,
 *       'version': 6,
 * }))
 *
 * @param {Order} order The Order
 * @param {boolean} [optIn] Flag for opting in
 * @return {Promise<Transactions>}
 * @memberOf module:txns/buy
 */
async function makePlaceAlgoTxns(
    order,
    optIn = false,
) {
  if (!(order.indexer instanceof algosdk.Indexer)) {
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

  if (order.contract?.amount === 0) {
    throw new Error('Cannot place a maker order with a 0 Amount');
  }

  logger.info({order: {price: order.price, amount: order.amount, total: order.total}, optIn}, 'Make Place Algo Txns');
  // TODO: Note that contains the creator address and the current operation.
  const _note = undefined;

  // If the order has a creator key, it already exists
  const _exists = typeof order?.contract?.creator !== 'undefined';
  if (_exists) {
    throw new TypeError('Adding to an existing algo escrow is disabled!');
  }

  let accountInfo;
  if (typeof order?.wallet?.assets === 'undefined' && !optIn) {
    logger.warn({address: order.address}, 'Loading account info!');
    ({account: accountInfo} = await order.indexer.lookupAccountByID(order.address).do()); // We need to have the same structure between the conditionals
  } else {
    accountInfo = order.wallet;
  }

  const _optIn = !optIn ?
    await getOptedIn(order.indexer, accountInfo, order.asset.id) :
    optIn;

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

