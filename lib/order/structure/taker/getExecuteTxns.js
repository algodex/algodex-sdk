/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const {makeExecuteAlgoTxns, makeExecuteAssetTxns} = require('../../txns');
const compile = require('../../compile');

/**
 * Get Executable Transactions
 *
 * Only supports execution of existing orders!
 *
 * @param {Order} order The Executable Order from the Orderbook
 * @param {boolean} withCloseout Should partially execute the order
 * @return {Promise<Structure[]>}
 * @ignore
 */
async function getExecuteTxns(order, withCloseout) {
  if (order.execution !== 'execute') {
    throw new Error(`Unsupported execution mode of ${order.execution}`);
  }
  const GENERATORS = {
    // Buy Orderbook
    buy: makeExecuteAlgoTxns,
    // Sell Orderbook
    sell: makeExecuteAssetTxns,
  };
  return await GENERATORS[order.type](await compile(order), withCloseout);
}

module.exports = getExecuteTxns;
