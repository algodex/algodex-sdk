/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const toBaseUnits = require('../../utils/units/toBaseUnits.js');
const toNumeratorDenominator = require('../utils/toNumeratorDenominator');
const toAsaUnits = require('../../utils/units/toAsaUnits');
/**
 * @typedef {Object} N/D
 * @property {Number} N Numerator
 * @property {Number} D Denominator
 * @ignore
 */

/**
 * ## [🧮 With Units](#withUnits)
 *
 * Compose the current order with it's converted units
 *
 * @example
 * const res = withUnits(order);
 * console.log(res.contract).
 * // Outputs {N,D,price,amount,total} in BaseUnits
 *
 * @todo: Make all numbers Big numbers
 * @param {Order} o Algodex Order
 * @return {Order} Order with Units
 * @memberOf module:order/compile
 */
function withUnits(o) {
  const isSell = o.type === 'sell';

  // Extract Price Parts
  const {N, D} = typeof o?.contract?.N === 'undefined' ?
    toNumeratorDenominator(toAsaUnits(o.price, o.asset.decimals)) :
    o.contract;

  // Compose D/N
  return {
    ...o,
    contract: {
      ...o?.contract,
      amount: isSell ? toBaseUnits(o.amount, o.asset.decimals) : toBaseUnits(o.amount),
      total: isSell ? toBaseUnits(o.total, o.asset.decimals) : toBaseUnits(o.total),
      N, D,
    },
  };
}

module.exports = withUnits;
