/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makeCloseAssetTxns = require('./makeCloseAssetTxns');

/**
 * ## withCloseAlgoTxns
 *
 * Composed Close Asset Transactions
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/sell
 * @private
 *
 */
async function withCloseAssetTxns(order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeCloseAssetTxns(order),
    },
  };
}

module.exports = withCloseAssetTxns;
