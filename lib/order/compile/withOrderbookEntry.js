/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const getOrderbookEntry = require('../utils/getOrderbookEntry');

/**
 * ## 🗃 [With Orderbook Entry](#withOrderbookEntry)
 *
 * Adds the orderbook entry to the order
 *
 * @param {Order} o Order
 * @return {Order} Order with Entry
 * @memberOf module:order/compile
 */
function withOrderbookEntry(o) {
  if (typeof o?.contract?.N === 'undefined') {
    throw new TypeError('Invalid Numerator!');
  }
  if (typeof o?.contract?.D === 'undefined') {
    throw new TypeError('Invalid Denominator!');
  }

  return {
    ...o,
    contract: {
      ...o.contract,
      entry: getOrderbookEntry(o),
    },
  };
}

module.exports = withOrderbookEntry;
