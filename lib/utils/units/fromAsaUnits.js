/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const Big = require('big.js');

/**
 * Converts limit price or balance in ASA units to ALGOs (for ASAs with
 * different `decimal` properties than ALGO).
 *
 * Formula: algo_units = asa_price * (10 ^ (decimals - 6))
 *
 * @param {Number} toConvert a price/balance in ASA units
 * @param {Number} decimals ASA's `decimals` property
 * @return {Number} converted price/balance
 */
function fromAsaUnits(toConvert, decimals) {
  if (!toConvert) {
    return 0;
  }
  const multiplier = new Big(10).pow(decimals - 6);
  const asaUnits = new Big(toConvert);
  return asaUnits.times(multiplier).toNumber();
}

module.exports = fromAsaUnits;
