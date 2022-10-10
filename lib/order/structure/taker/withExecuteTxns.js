/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const getExecuteTxns = require('./getExecuteTxns');

/**
 * Composed Get Execute Txns
 *
 * @param {Order} order A Executable Order
 * @param {boolean} withCloseout Execute as a Closeout
 * @return {Promise<Order>}
 * @ignore
 */
async function withExecuteTxns(order, withCloseout) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getExecuteTxns(order, withCloseout),
    },
  };
}
module.exports = withExecuteTxns;
