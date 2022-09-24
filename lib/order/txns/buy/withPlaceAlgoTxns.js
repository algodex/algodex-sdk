/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makePlaceAlgoTxns = require('./makePlaceAlgoTxns');
/**
 * # 🔗 withPlaceAlgoTxns
 *
 * > Order Composed with Place Transaction
 *
 * Add the outer transactions for an Algo order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @example
 * const order = withPlaceAlgoTxns(await compile({
 *     'asset': {
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
 * // View the transactions
 * console.log(order.contract.txns)
 *
 * @see module:txns/buy.makePlaceAlgoTxns
 * @param {Order} order Algodex Order
 * @param {boolean} [optIn] Flag to enable opting into the asset
 * @return {Promise<Order>} The Order with Transaction
 * @memberOf module:txns/buy
 * @private
 */
async function withPlaceAlgoTxns(order, optIn = false) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: await makePlaceAlgoTxns(order, optIn),
      creator: order.wallet.address,
    },
  };
}

module.exports = withPlaceAlgoTxns;
