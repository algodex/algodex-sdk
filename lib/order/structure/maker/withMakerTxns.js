/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const getMakerTxns = require('./getMakerTxns');

/**
 * # 🔗 withMakerTxns
 * Accepts an [Order]{@link Order} with execution type [Maker]{@tutorial Maker} and generates the relevant transactions.
 *
 *
 * ### Existing Escrow (Only relevant for [makePlaceAlgo]{@link module:txns/buy.makePlaceAlgo} )
 * When a user places a maker order, we first check to see if the [Algodex Orderbook]{@tutorial Orderbook} already has an Order entry at that price, from that User.
 *  * If that order exists, we generate a set of transactions that adds to the existing order.
 *  * If the order does not exist, we generate a set of transactions to create a new maker order.
 *
 * You can learn more about the differences between the two types of transactions in the trasnaction table for [makePlaceAlgoTxns]{@link module:txns/buy.makePlaceAlgoTxns} factory.
 *
 * ### When is it used?
 * This method and the corresponding Factory is used anytime a Maker order is added to the [Algodex Orderbook]{@tutorial Orderbook}.
 *
 * This method is the maker leg of [getMakerTakerTxns]{@link module:order/structures.getMakerTakerTxns}.
 *
 * This method would be ideal for use in algorithmic trading strategies and for programmaticaly providing liquidity to the [Algodex Orderbook]{@tutorial Orderbook}
 *
 *
 *
 *
 * @example
 * const [AlgodexAPI]{@link AlgodexApi} = require(@algodex/algodex-sdk)
 * const api = new [AlgodexAPI]{@link AlgodexApi}(require('../config.json'))
 * const order = {
 *   "client": api.algod,
 *   "indexer": api.indexer,
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "maker",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * }
 * const {[compile]{@link module:order/compile}} = require(@algodex/algodex-sdk/order)
 *
 * //order.execution === 'maker'
 * let res = await withMakerTxns(api, await [compile]{@link module:order/compile}(order))
 * console.log(res.contract.txns)
 * //Outputs:
 * [makePlaceAlgoTxns]{@link module:txns/buy.makePlaceAlgoTxns} || [makePlaceAssetTxns]{@link module:txns/sell.makePlaceAssetTxns}
 *
 * @param {Api} api Instance of AlgodexApi
 * @param {Order} order The User's Order
 * @return {Promise<Order>}
 * @memberOf module:order/structure
 * @see [getMakerTxns]{@link getMakerTxns} || [makePlaceAlgoTxns]{@link module:txns/buy.makePlaceAlgoTxns} || [makePlaceAssetTxns]{@link module:txns/sell.makePlaceAssetTxns}
 */
async function withMakerTxns(api, order) {
  const isExistingEscrow = await api.getIsExistingEscrow(order);
  if (isExistingEscrow) {
    order.contract = {
      ...order.contract,
      creator: order.address,
    };
  }

  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getMakerTxns(order, isExistingEscrow),
      creator: order.address,
    },
  };
}
module.exports = withMakerTxns;
