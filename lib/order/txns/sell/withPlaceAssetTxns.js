/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makePlaceAssetTxns = require('./makePlaceAssetTxns');
/**
 * ## ✉ withPlaceAssetTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:txns/sell
 * @private
 */
async function withPlaceAssetTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: await makePlaceAssetTxns(order, order.isExistingEscrow),
      creator: order.wallet.address,
    },

  };
}

module.exports = withPlaceAssetTxns;

