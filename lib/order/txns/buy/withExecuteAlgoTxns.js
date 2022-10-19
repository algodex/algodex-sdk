/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 * # 🔗 withExecuteAlgoTxns
 *
 * > Composed Order with Execution Transactions
 *
 * @param {Order} order
 * @param {boolean} withCloseout
 * @return {Promise<Order>}
 * @memberOf module:txns/buy
 * @private
 */
async function withExecuteAlgoTxns(order, withCloseout) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeExecuteAlgoTxns(order, withCloseout),
    },
  };
}

module.exports = withExecuteAlgoTxns;
